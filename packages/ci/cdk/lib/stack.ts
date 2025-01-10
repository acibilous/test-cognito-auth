import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class NitroAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'NitroAppVpc', {
      maxAzs: 2,
      natGateways: 1
    });

    // ECR Repository
    const repository = new ecr.Repository(this, 'NitroAppRepo', {
      repositoryName: 'nitro-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          tagPrefixList: ['prod-'],
          maxImageCount: 5
        },
        {
          tagPrefixList: ['staging-'],
          maxImageCount: 3
        },
        {
          tagStatus: ecr.TagStatus.UNTAGGED,
          maxImageAge: cdk.Duration.days(7)
        }
      ]
    });

    // ECS Cluster with Fargate
    const cluster = new ecs.Cluster(this, 'NitroAppCluster', {
      vpc,
      clusterName: 'nitro-app-cluster'
    });

    // Aurora DB
    const dbCluster = new rds.DatabaseCluster(this, 'AuroraDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3
      }),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      defaultDatabaseName: 'nitrodb'
    });

    // Створюємо Log Group
    const logGroup = new logs.LogGroup(this, 'NitroAppLogGroup', {
      logGroupName: '/aws/ecs/nitro-app',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'NitroAppService', {
      cluster,
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 2,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
        // image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
        containerPort: 80,
        secrets: {
          DB_HOST: ecs.Secret.fromSecretsManager(dbCluster.secret!, 'host'),
          DB_PORT: ecs.Secret.fromSecretsManager(dbCluster.secret!, 'port'),
          DB_NAME: ecs.Secret.fromSecretsManager(dbCluster.secret!, 'dbname'),
          DB_USER: ecs.Secret.fromSecretsManager(dbCluster.secret!, 'username'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(dbCluster.secret!, 'password')
        },
        environment: {
          DATABASE_URL_FORMAT: 'postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}'
        },
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: 'nitro-app',
          logGroup: logGroup
        })
      },
      publicLoadBalancer: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60)
    });

    // Додаємо дозволи для ECR
    repository.grantPull(fargateService.taskDefinition.executionRole!);

    // Configure health check after service creation
    fargateService.targetGroup.configureHealthCheck({
      path: '/',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3
    });

    // Allow DB access from Fargate tasks
    dbCluster.connections.allowDefaultPortFrom(fargateService.service.connections);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'NitroAppUserPool', {
      userPoolName: 'nitro-app-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      }
    });

    // Додаємо домен для User Pool
    const domain = userPool.addDomain('NitroAppDomain', {
      cognitoDomain: {
        domainPrefix: 'nitro-app'
      }
    });

    // Створюємо Resource Server для кастомних скоупів
    const resourceServer = userPool.addResourceServer('ResourceServer', {
      identifier: 'api',
      scopes: [
        new cognito.ResourceServerScope({
          scopeName: 'write',
          scopeDescription: 'Write access to API'
        })
      ]
    });

    // Cognito Client для client_credentials auth
    const client = userPool.addClient('NitroAppClient', {
      generateSecret: true,
      oAuth: {
        flows: {
          clientCredentials: true
        },
        scopes: [
          cognito.OAuthScope.resourceServer(resourceServer, new cognito.ResourceServerScope({
            scopeName: 'write',
            scopeDescription: 'Write access to API'
          }))
        ]
      }
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'NitroAppApi', {
      restApiName: 'Nitro App API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS
      }
    });

    // Створюємо API Key
    const apiKey = api.addApiKey('NitroAppApiKey', {
      apiKeyName: 'NitroAppApiKey',
      description: 'API Key for Nitro App',
      value: undefined  // AWS згенерує значення автоматично
    });

    // Створюємо Usage Plan
    const usagePlan = api.addUsagePlan('NitroAppUsagePlan', {
      name: 'Standard',
      apiStages: [{
        api: api,
        stage: api.deploymentStage
      }],
      throttle: {
        rateLimit: 10,
        burstLimit: 2
      }
    });

    // Додаємо API Key до Usage Plan
    usagePlan.addApiKey(apiKey);

    // Створюємо інтеграцію з ALB для GET /users
    const getUsersIntegration = new apigateway.HttpIntegration(
      `http://${fargateService.loadBalancer.loadBalancerDnsName}/users`,
      {
        httpMethod: 'GET'
      }
    );

    // Створюємо інтеграцію з ALB для POST методу
    const postIntegration = new apigateway.HttpIntegration(
      `http://${fargateService.loadBalancer.loadBalancerDnsName}/users`,
      {
        httpMethod: 'POST',
        options: {
          requestParameters: {
            'integration.request.header.Authorization': 'method.request.header.Authorization'
          }
        }
      }
    );

    // Проксі інтеграція для інших методів
    const proxyIntegration = new apigateway.HttpIntegration(
      `http://${fargateService.loadBalancer.loadBalancerDnsName}/users/{proxy}`,
      {
        proxy: true,
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy'
          }
        }
      }
    );

    // Ресурс /users з проксі
    const users = api.root.addResource('users');
    const userProxy = users.addResource('{proxy+}');

    // GET /users - список користувачів
    users.addMethod('GET', getUsersIntegration, {
      apiKeyRequired: true
    });

    // POST /users - з Cognito auth
    users.addMethod('POST', postIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: new apigateway.CognitoUserPoolsAuthorizer(this, 'NitroAppAuthorizer', {
        cognitoUserPools: [userPool],
        authorizerName: 'NitroAppAuthorizer',
        identitySource: 'method.request.header.Authorization'
      }),
      requestParameters: {
        'method.request.header.Authorization': true
      },
      authorizationScopes: [`${resourceServer.userPoolResourceServerId}/write`]
    });

    // Всі інші методи для /users/{id} - з API Key
    ['GET', 'PUT', 'DELETE'].forEach(method => {
      userProxy.addMethod(method, proxyIntegration, {
        apiKeyRequired: true,
        requestParameters: {
          'method.request.path.proxy': true
        }
      });
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url
    });
    new cdk.CfnOutput(this, 'ApiKey', {
      value: apiKey.keyId
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    });
    new cdk.CfnOutput(this, 'ClientId', {
      value: client.userPoolClientId
    });
  }
} 