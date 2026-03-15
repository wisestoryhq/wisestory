<p align="center">
  <img src="https://img.youtube.com/vi/nG0DREwPXu0/maxresdefault.jpg" alt="WiseStory" width="600" />
</p>

<h1 align="center">WiseStory</h1>

<p align="center">
  <strong>Your brand's AI creative director. Connect your docs, build brand intelligence, and generate cohesive content across every platform.</strong>
</p>

<p align="center">
  <a href="https://geminiliveagentchallenge.devpost.com"><img src="https://img.shields.io/badge/Gemini_Live_Agent_Challenge-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini Live Agent Challenge" /></a>
  <a href="https://youtu.be/nG0DREwPXu0"><img src="https://img.shields.io/badge/Demo_Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Demo Video" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini 2.5 Flash" />
  <img src="https://img.shields.io/badge/Google_ADK_v0.5-34A853?style=flat-square&logo=google&logoColor=white" alt="Google ADK" />
  <img src="https://img.shields.io/badge/Cloud_Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white" alt="Cloud Run" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="pgvector" />
  <img src="https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## About the Hackathon

WiseStory was built for the [**Gemini Live Agent Challenge**](https://geminiliveagentchallenge.devpost.com), Google's hackathon focused on building next-generation AI agents with multimodal inputs and outputs. The challenge has three categories: Live Agents, Creative Storytellers, and UI Navigators.

WiseStory competes in the **Creative Storyteller** category, which calls for multimodal storytelling with interleaved output, where an agent combines text, visuals, narration, and mixed-media content in one cohesive flow.

### Demo Video

[![WiseStory Demo](https://img.youtube.com/vi/nG0DREwPXu0/hqdefault.jpg)](https://youtu.be/nG0DREwPXu0)

---

## What is WiseStory?

WiseStory is a multi-tenant, AI-powered creative storytelling platform that transforms scattered company knowledge into cohesive, brand-grounded content.

Connect your Google Drive, and WiseStory ingests your brand materials (guidelines, images, tone docs, campaign references) to build a workspace-level knowledge base. Then, through a multi-turn briefing chat, a creative director agent collaborates with you to generate platform-ready content.

**Supported formats:**

- Instagram Posts, Carousels, and Reels
- TikTok Videos
- YouTube Shorts and long-form Videos
- Multi-platform Campaign Packages

**What makes it different:**

- **Interleaved multimodal output** — text, generated images, storyboards, voiceover scripts, and captions are produced together in one creative package, not assembled separately
- **Grounded in your brand** — every output references the exact source materials that influenced it
- **Workspace-level RAG** — brand knowledge is shared across all projects, not duplicated per campaign
- **Media-type aware** — each format gets its own structure, pacing, and visual treatment

---

## How It Works

1. **Connect sources** — Link your Google Drive. WiseStory ingests brand docs, guidelines, images, and past campaigns.
2. **AI understands** — Documents are chunked, embedded, and indexed using Gemini Embedding 2 (preview), Google's natively multimodal embedding model, with pgvector for semantic retrieval.
3. **Generate stories** — Pick a media format, write a prompt. A Gemini-powered creative director produces interleaved text and images grounded in your brand knowledge.

---

## Architecture

| Component | Tech | Description |
|---|---|---|
| **Web App** | Next.js 16, React 19, Tailwind CSS 4 | Frontend + API routes, Google OAuth via Better Auth |
| **Agent Service** | Hono, Google ADK v0.5 | Creative director agent with SSE streaming |
| **Database** | PostgreSQL 16 + pgvector | Users, workspaces, projects, campaigns, knowledge chunks + 768-dim embeddings |
| **Creative Director** | Gemini 2.5 Flash Image | Multi-turn chat with native image generation |
| **Decision Extraction** | Gemini 2.5 Flash | Knowledge graph construction from conversations |
| **Embeddings** | Gemini Embedding 2 (preview) | Multimodal semantic search across text, images, and PDFs |
| **Hosting** | Google Cloud Run | Both services deployed as containers |
| **Database Hosting** | Google Cloud SQL | Managed PostgreSQL with pgvector extension |
| **Secrets** | Google Secret Manager | All credentials injected at runtime |
| **Infrastructure** | Terraform | Full IaC for GCP provisioning |

---

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for local PostgreSQL)
- Google Cloud project with:
  - [Generative Language API](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com) enabled
  - [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) enabled
  - OAuth 2.0 credentials (Web application type)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Getting Started

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

This starts a local PostgreSQL 16 instance with pgvector on port 5434.

### 4. Run migrations

```bash
pnpm --filter @wisestory/db exec prisma migrate dev
```

### 5. Generate Prisma client

```bash
pnpm --filter @wisestory/db exec prisma generate
```

### 6. Start dev servers

```bash
pnpm turbo dev
```

This starts both services:

- **Web app**: http://localhost:3000
- **Agent service**: http://localhost:3001

### 7. Sign in and create a workspace

1. Open http://localhost:3000
2. Sign in with Google
3. Create a workspace and give it a name
4. Connect a Google Drive folder with your brand assets
5. Wait for indexing to complete
6. Create a project, choose a media type, and start generating

---

## Cloud Deployment (GCP)

Infrastructure is managed with Terraform. Deployment uses Cloud Build.

### Provision infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in your project ID, region, and secrets
terraform init
terraform apply
```

This creates:
- Cloud Run services (web + agent)
- Cloud SQL instance (PostgreSQL 16 + pgvector)
- Artifact Registry (Docker image storage)
- Secret Manager secrets (DATABASE_URL, auth secrets, API keys)
- IAM service accounts with least-privilege access

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

---

## Project Structure

```
wisestory/
├── apps/
│   ├── web/                  # Next.js 16 frontend + API routes
│   └── agent-service/        # Hono service with Google ADK agents
├── packages/
│   ├── db/                   # Prisma schema, migrations, client
│   ├── contracts/            # Shared API contracts (Zod schemas)
│   ├── prompts/              # Prompt templates for agents
│   └── types/                # Shared TypeScript types
├── infra/
│   ├── terraform/            # GCP infrastructure as code
│   └── deploy.sh             # Cloud Build + Cloud Run deploy script
└── docker/                   # Docker Compose for local dev
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Hono, Google ADK v0.5 |
| **AI Models** | Gemini 2.5 Flash Image (generation), Gemini 2.5 Flash (extraction), Gemini Embedding 2 Preview (embeddings) |
| **Database** | PostgreSQL 16, pgvector, Prisma ORM |
| **Auth** | Better Auth with Google OAuth |
| **Infrastructure** | Google Cloud Run, Cloud SQL, Secret Manager, Artifact Registry |
| **IaC** | Terraform (google provider ~> 6.0) |
| **Monorepo** | pnpm 10 workspaces, Turborepo |
| **Language** | TypeScript everywhere |

---

## Testing Guide for Judges

The fastest way to test WiseStory is through the live deployment. No setup required.

### Option 1: Live App (recommended)

1. Go to [**wisestory.co**](https://wisestory.co)
2. Sign in with your Google account
3. Create a new workspace (give it any name)
4. Connect a Google Drive folder that contains brand materials (guidelines, images, docs, or past campaigns). If you do not have one ready, create a Drive folder with a few sample files.
5. Wait for the indexing progress bar to complete
6. Create a project inside your workspace
7. Choose a media type (e.g., Instagram Carousel, YouTube Shorts, TikTok Video)
8. Enter a prompt describing the content you want (e.g., "Create a product launch announcement for our new feature")
9. Watch the creative director agent generate an interleaved multimodal response with text, images, storyboards, and source references in a single stream

**What to look for:**
- The output is a cohesive creative package, not separate text and image generations
- Generated content references your actual Drive assets (source grounding)
- Each media type produces a different structure (a carousel has slides, a reel has timed scenes, a YouTube script has sections)
- You can iterate with follow-up prompts to refine tone, style, or format

### Google Cloud Proof

WiseStory runs entirely on Google Cloud. Here are direct links to the code that demonstrates usage:

**Gemini Models**
- [`apps/agent-service/src/agent.ts#L30`](https://github.com/wisestoryhq/wisestory/blob/main/apps/agent-service/src/agent.ts#L30) — Gemini 2.5 Flash Image agent for interleaved text + image generation
- [`apps/agent-service/src/tools/extract-decisions.ts#L41`](https://github.com/wisestoryhq/wisestory/blob/main/apps/agent-service/src/tools/extract-decisions.ts#L41) — Gemini 2.5 Flash for decision extraction
- [`apps/web/src/lib/embeddings.ts#L5`](https://github.com/wisestoryhq/wisestory/blob/main/apps/web/src/lib/embeddings.ts#L5) — Gemini Embedding 2 Preview for multimodal embeddings
- [`apps/agent-service/src/tools/retrieve-knowledge.ts#L9`](https://github.com/wisestoryhq/wisestory/blob/main/apps/agent-service/src/tools/retrieve-knowledge.ts#L9) — Gemini Embedding 2 Preview for query embedding at retrieval time

**Google ADK (Agent Development Kit)**
- [`apps/agent-service/src/index.ts#L5`](https://github.com/wisestoryhq/wisestory/blob/main/apps/agent-service/src/index.ts#L5) — ADK Runner, InMemorySessionService, and StreamingMode setup
- [`apps/agent-service/src/agent.ts#L1`](https://github.com/wisestoryhq/wisestory/blob/main/apps/agent-service/src/agent.ts#L1) — LlmAgent instantiation with tools and system prompts
- [`apps/agent-service/src/tools/retrieve-knowledge.ts#L67`](https://github.com/wisestoryhq/wisestory/blob/main/apps/agent-service/src/tools/retrieve-knowledge.ts#L67) — ADK FunctionTool for RAG retrieval

**Google Drive API**
- [`apps/web/src/lib/google-drive.ts`](https://github.com/wisestoryhq/wisestory/blob/main/apps/web/src/lib/google-drive.ts) — OAuth2 client and Drive scopes
- [`apps/web/src/app/api/drive/ingest/route.ts#L132`](https://github.com/wisestoryhq/wisestory/blob/main/apps/web/src/app/api/drive/ingest/route.ts#L132) — Drive API v3 file listing and ingestion
- [`apps/web/src/app/api/drive/connect/route.ts#L23`](https://github.com/wisestoryhq/wisestory/blob/main/apps/web/src/app/api/drive/connect/route.ts#L23) — OAuth URL generation for Drive consent

**Google Cloud Infrastructure (Terraform)**
- [`infra/terraform/main.tf#L161`](https://github.com/wisestoryhq/wisestory/blob/main/infra/terraform/main.tf#L161) — Cloud Run service definition (web)
- [`infra/terraform/main.tf#L275`](https://github.com/wisestoryhq/wisestory/blob/main/infra/terraform/main.tf#L275) — Cloud Run service definition (agent)
- [`infra/terraform/main.tf#L47`](https://github.com/wisestoryhq/wisestory/blob/main/infra/terraform/main.tf#L47) — Cloud SQL PostgreSQL 16 with pgvector
- [`infra/deploy.sh#L45`](https://github.com/wisestoryhq/wisestory/blob/main/infra/deploy.sh#L45) — Cloud Build + Cloud Run deployment script

### Option 2: Run locally

Follow the [Getting Started](#getting-started) section above. You will need:
- Node.js 22+, pnpm 10+, Docker
- A Google Cloud project with OAuth credentials and the Generative Language + Drive APIs enabled
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Common Commands

```bash
# Build everything
pnpm turbo build

# Lint all packages
pnpm turbo lint

# Typecheck all packages
pnpm turbo typecheck

# Run tests
pnpm turbo test

# Reset local database
docker compose down -v && docker compose up -d
pnpm --filter @wisestory/db exec prisma migrate dev

# Open Prisma Studio (database GUI)
pnpm --filter @wisestory/db exec prisma studio

# Add a dependency to a specific package
pnpm --filter @wisestory/web add <package>
```

---

## License

MIT
