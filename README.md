# org.id-migration-backend

The ORGiD migration backend server

## Setup

```bash
yarn
yarn build
cp ./.env.example ./.env
```

## Start in development environment

```bash
./scripts/redis.sh
yarn start:dev
```

## Start in production environment

> Creation of the application build is required for the production environment

```bash
yarn build
yarn start
```

## Deployment

Currently, deploys to both `test` environment and `prod` environment are possible via a manual trigger of a GitHuyb action:

![image](https://user-images.githubusercontent.com/2273090/203947449-7165e485-937d-4c77-a547-cb5451040cb3.png)

- for `prod` env, you need to select the `ci-deploy-prod` action, and trigger a worflow for branch `main`
- for `test` env, you need to select the `ci-deploy-test` action, and trigger a worflow for branch `develop`
