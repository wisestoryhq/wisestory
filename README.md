# WiseStory

AI-powered content generation platform that turns brand knowledge into visual stories. Connect your Google Drive, let Gemini understand your content, and generate compelling interleaved text + image outputs for Instagram, TikTok, YouTube, and more.

Built for the **Gemini Live Agent Challenge** — Creative Storyteller category.

## How It Works

1. **Connect sources** — Link your Google Drive. WiseStory ingests brand docs, guidelines, images, and past campaigns.
2. **AI understands** — Documents are chunked, embedded, and indexed using Gemini Embeddings + pgvector for semantic retrieval.
3. **Generate stories** — Pick a media format, write a prompt. A two-stage agent pipeline (Planner → Creator) produces interleaved text and images grounded in your brand knowledge.

## Architecture

| Component | Tech | Description |
|---|---|---|
| **Web App** | Next.js 16, React 19, Tailwind CSS | Frontend + API routes, Google OAuth via Better Auth |
| **Agent Service** | Hono, Google ADK | Two-stage generation pipeline (Planner + Creator agents) |
| **Database** | PostgreSQL 16 + pgvector | Users, workspaces, projects, campaigns, knowledge chunks + embeddings |
| **Planner Agent** | Gemini 2.5 Pro | Retrieves brand knowledge, creates creative briefs |
| **Creator Agent** | Gemini 2.5 Flash | Generates interleaved text + images from briefs |
| **Embeddings** | gemini-embedding-001 | Semantic search over ingested knowledge |
| **Hosting** | Google Cloud Run | Both services deployed as containers |
| **Secrets** | Google Secret Manager | All credentials injected at runtime |
| **Infrastructure** | Terraform | Full IaC for GCP provisioning |

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for local PostgreSQL)
- Google Cloud project with:
  - [Generative Language API](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com) enabled
  - [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) enabled
  - OAuth 2.0 credentials (Web application type)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/wisestoryhq/wisestory.git
cd wisestory
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (default works with Docker Compose) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GEMINI_API_KEY` | Gemini API key from AI Studio |
| `BETTER_AUTH_SECRET` | Random secret for session signing (generate with `openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | `http://localhost:3000` for local dev |
| `AGENT_SERVICE_URL` | `http://localhost:3001` for local dev |

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run migrations

```bash
pnpm --filter @wisestory/db exec prisma migrate dev
```

### 5. Start dev servers

```bash
pnpm turbo dev
```

- Web app: http://localhost:3000
- Agent service: http://localhost:3001

## Cloud Deployment (GCP)

Infrastructure is managed with Terraform. Deployment uses Cloud Build.

### Provision infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in your values
terraform init
terraform apply
```

This creates: Cloud Run services, Cloud SQL (PostgreSQL + pgvector), Artifact Registry, Secret Manager secrets, IAM service accounts.

### Build and deploy

```bash
cd infra
# Deploy both services
./deploy.sh all

# Or individually
./deploy.sh web
./deploy.sh agent

# Run database migrations on Cloud SQL
./deploy.sh migrate
```

Requires `GCP_PROJECT_ID` and `GCP_REGION` environment variables.

## Project Structure

```
wisestory/
├── apps/
│   ├── web/                  # Next.js frontend + API routes
│   └── agent-service/        # Hono service with ADK agents
├── packages/
│   ├── db/                   # Prisma schema + client
│   ├── contracts/            # Shared API contracts (Zod schemas)
│   ├── prompts/              # Prompt templates for agents
│   └── types/                # Shared TypeScript types
├── infra/
│   ├── terraform/            # GCP infrastructure as code
│   └── deploy.sh             # Cloud Build + Cloud Run deploy script
└── docker/                   # Docker Compose for local dev
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Hono, Google ADK (Agent Development Kit)
- **AI**: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini Embeddings
- **Database**: PostgreSQL 16, pgvector, Prisma ORM
- **Auth**: Better Auth (Google OAuth)
- **Infra**: Google Cloud Run, Cloud SQL, Secret Manager, Terraform
- **Monorepo**: pnpm workspaces, Turborepo

## License

MIT
