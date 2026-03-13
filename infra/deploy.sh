#!/usr/bin/env bash
#
# Build and deploy Wisestory services to Cloud Run.
#
# Infrastructure (Cloud SQL, secrets, IAM, etc.) is managed by Terraform
# in infra/terraform/. This script only builds images and deploys them.
#
# Usage:
#   ./infra/deploy.sh              # Build & deploy both services
#   ./infra/deploy.sh web          # Build & deploy web only
#   ./infra/deploy.sh agent        # Build & deploy agent-service only
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
REPO="${REGION}-docker.pkg.dev/${PROJECT_ID}/wisestory"

WEB_IMAGE="${REPO}/wisestory-web"
AGENT_IMAGE="${REPO}/wisestory-agent"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()  { echo "==> $*"; }
error() { echo "ERROR: $*" >&2; exit 1; }

check_deps() {
  command -v gcloud >/dev/null || error "gcloud CLI not found"
  gcloud config set project "$PROJECT_ID" --quiet
}

# ---------------------------------------------------------------------------
# Build & deploy
# ---------------------------------------------------------------------------
build_and_deploy_web() {
  info "Building web image with Cloud Build..."
  cd "$ROOT_DIR"
  gcloud builds submit . \
    --tag "${WEB_IMAGE}:latest" \
    --timeout=1200s \
    --gcs-log-dir="gs://${PROJECT_ID}_cloudbuild/logs" \
    --dockerfile=apps/web/Dockerfile \
    --quiet

  info "Deploying web to Cloud Run..."
  gcloud run services update wisestory-web \
    --region "$REGION" \
    --image "${WEB_IMAGE}:latest" \
    --quiet

  WEB_URL=$(gcloud run services describe wisestory-web --region "$REGION" --format='value(status.url)')
  info "Web deployed: $WEB_URL"

  # Update BETTER_AUTH_URL to match the actual service URL
  info "Setting BETTER_AUTH_URL..."
  gcloud run services update wisestory-web \
    --region "$REGION" \
    --update-env-vars="BETTER_AUTH_URL=${WEB_URL}" \
    --quiet
}

build_and_deploy_agent() {
  info "Building agent-service image with Cloud Build..."
  cd "$ROOT_DIR"
  gcloud builds submit . \
    --tag "${AGENT_IMAGE}:latest" \
    --timeout=1200s \
    --gcs-log-dir="gs://${PROJECT_ID}_cloudbuild/logs" \
    --dockerfile=apps/agent-service/Dockerfile \
    --quiet

  info "Deploying agent-service to Cloud Run..."
  gcloud run services update wisestory-agent \
    --region "$REGION" \
    --image "${AGENT_IMAGE}:latest" \
    --quiet

  AGENT_URL=$(gcloud run services describe wisestory-agent --region "$REGION" --format='value(status.url)')
  info "Agent service deployed: $AGENT_URL"

  # Update web's AGENT_SERVICE_URL to point to new agent URL
  info "Updating web with agent service URL..."
  gcloud run services update wisestory-web \
    --region "$REGION" \
    --update-env-vars="AGENT_SERVICE_URL=${AGENT_URL}" \
    --quiet
}

# ---------------------------------------------------------------------------
# Run DB migrations against Cloud SQL
# ---------------------------------------------------------------------------
migrate() {
  info "Running database migrations..."
  info "Ensure you have Cloud SQL Proxy running or a direct connection."
  info "Example: cloud-sql-proxy ${PROJECT_ID}:${REGION}:wisestory-db --port=5433"
  echo ""
  info "Then run:"
  echo "  DATABASE_URL='postgresql://wisestory:PASSWORD@localhost:5433/wisestory' \\"
  echo "    pnpm --filter @wisestory/db exec prisma migrate deploy"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
check_deps

case "${1:-all}" in
  web)
    build_and_deploy_web
    ;;
  agent)
    build_and_deploy_agent
    ;;
  all)
    build_and_deploy_agent
    build_and_deploy_web
    ;;
  migrate)
    migrate
    ;;
  *)
    echo "Usage: $0 {web|agent|all|migrate}"
    exit 1
    ;;
esac

info "Done!"
