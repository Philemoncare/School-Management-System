# School Management Platform (ERP SaaS)

A production-grade, multi-tenant School Management and Education ERP SaaS platform.

## Architecture

This project is organized as a **monorepo**:

- `apps/web`: Next.js frontend application.
- `apps/api`: NestJS backend application.
- `packages/`: Shared packages for types, configuration, and validation.
- `docs/`: Comprehensive architectural and API documentation.

## Technology Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache & Queue:** Redis, BullMQ
- **Real-time:** Socket.IO
- **Storage:** S3-compatible Object Storage

## Local Development Setup

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- npm (or pnpm/yarn)

### 1. Clone the repository

```bash
git clone <repository-url>
cd school-management-platform
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

### 3. Start Infrastructure

Run the following command to start PostgreSQL, Redis, and MinIO:

```bash
docker-compose up -d
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Database Initialization

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Run Applications

From the root directory:

```bash
# Start all applications
npm run dev

# Or start individually
npm run dev --workspace=@school/web
npm run dev --workspace=@school/api
```

## Repository Structure

```
school-management-platform/
├── apps/
│   ├── web/        # Next.js Frontend
│   └── api/        # NestJS API
├── packages/
│   ├── types/      # Shared TypeScript definitions
│   ├── config/     # Shared configuration (ESLint, Prettier, etc.)
│   ├── validation/ # Shared Zod/Class-validator schemas
│   └── shared/     # Shared utilities
├── docs/           # Architectural Documentation
├── infrastructure/ # Docker & Deployment scripts
└── .env.example    # Template for environment variables
```

## Development Conventions

- **Strict TypeScript:** No `any` types unless absolutely necessary.
- **Modular Design:** Keep business logic within their respective domain modules.
- **Tenancy:** Always ensure `schoolId` is handled in data operations.
- **Security:** Never commit secrets; use environment variables.
- **Testing:** Write unit tests for business logic and integration tests for APIs.
