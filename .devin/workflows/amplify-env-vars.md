---
description: How to expose environment variables to the SSR Lambda on Amplify Gen 1
---

## Problem

Amplify Gen 1 SSR runs Next.js API routes inside a Lambda function. Environment variables set in the Amplify Console are available during the **build phase** but are **not automatically injected into the SSR Lambda runtime**. This causes errors like:

```
PrismaClientInitializationError: Environment variable not found: DATABASE_URL.
```

even when the variable is correctly set in the Amplify Console.

## Fix

Two changes are required every time a new server-side environment variable is added:

### 1. `next.config.js` — bake vars into the SSR bundle

Add each variable to the `env` block so Next.js embeds the value at build time:

```js
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    // add new server-side vars here
  },
}
```

### 2. `amplify.yml` — write `.env.production` during build

Prisma's native query engine reads env files directly (independent of `process.env`), so the file must be written during the build phase:

```yaml
build:
  commands:
    - echo "DATABASE_URL=$DATABASE_URL" >> .env.production
    - echo "JWT_SECRET=$JWT_SECRET" >> .env.production
    # add new vars here too
    - npx prisma migrate deploy
    - npm run build
```

## Adding a new environment variable

1. Add it in the Amplify Console → App settings → Environment variables
2. Add it to the `env` block in `next.config.js`
3. Add an `echo` line for it in `amplify.yml`
4. Commit and push — Amplify will redeploy automatically
