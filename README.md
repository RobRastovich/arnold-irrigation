# Arnold Irrigation

Irrigation Management System

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize Prisma:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```
