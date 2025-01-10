#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as cdk from 'aws-cdk-lib';
import { NitroAppStack } from '../cdk/lib/stack';
import { execSync } from 'child_process';

dotenv.config();

// Отримуємо AWS account ID з credentials
const AWS_ACCOUNT_ID = execSync('aws sts get-caller-identity --query Account --output text').toString().trim();

const app = new cdk.App();
new NitroAppStack(app, 'NitroAppStack', {
  env: { 
    account: AWS_ACCOUNT_ID,
    region: 'eu-north-1'
  },
}); 