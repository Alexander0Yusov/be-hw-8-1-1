# be-hw-8-1-1

Backend service on NestJS with PostgreSQL and Vercel deployment via GitHub Actions.

## Requirements

- Node.js 22
- pnpm 10
- PostgreSQL 14+

## Install

```bash
pnpm install
```

## Environment Configuration

Environment files are loaded in this order (higher priority first):

1. `ENV_FILE_PATH` (if provided)
2. `.env.<NODE_ENV>.local`
3. `.env.<NODE_ENV>`
4. `.env.production`

Local runtime files are ignored by Git. Commit only `*.example` templates.

### Templates in repo

- `.env.development.example`
- `.env.testing.example`
- `.env.staging.example`
- `.env.production.example`
- `.env.example`

### Create local files

Linux/macOS:

```bash
cp .env.development.example .env.development
cp .env.testing.example .env.testing
```

PowerShell:

```powershell
Copy-Item .env.development.example .env.development
Copy-Item .env.testing.example .env.testing
```

### Required variables (minimum)

- `NODE_ENV` (`development` | `testing` | `staging` | `production`)
- `PORT`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRE_IN`
- `REFRESH_TOKEN_EXPIRE_IN`
- `INCLUDE_TESTING_MODULE`

Production recommendations:

- `NODE_ENV=production`
- `INCLUDE_TESTING_MODULE=false`
- `IS_SWAGGER_ENABLED=false`
- Use strong random token secrets

## Run

```bash
# default start
pnpm start

# development watch mode
pnpm start:dev

# production local run (after build)
pnpm build
pnpm start:prod
```

## Test

```bash
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e
```

## CI/CD and Branches

- Push to `staging`:
  - run tests
  - deploy Vercel Preview (`.github/workflows/test-and-deploy-vercel.yaml`)
- Push to `main`:
  - run tests
  - deploy Vercel Production (`.github/workflows/deploy-production-vercel.yaml`)

## Security Best Practices

- Never commit real `.env*` files.
- Store production/staging values only in Vercel/GitHub Secrets.
- If any secret was committed before, rotate it.
- Keep `.env.*.example` up to date when adding/changing config keys.