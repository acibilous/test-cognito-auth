FROM --platform=linux/amd64 node:22-slim as builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:22-slim

WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

ENV PORT=80
EXPOSE 80
CMD ["node", ".output/server/index.mjs"]
