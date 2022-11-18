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
