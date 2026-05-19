#!/usr/bin/env bash
# migrate_to_monorepo.sh
# Validates that all necessary files are in place for the platform monorepo.
# Run from the rag_chatbot/ root.

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLATFORM="$ROOT/platform"

echo "=== Shrimali AI Platform — Monorepo Migration Validator ==="
echo "Root: $ROOT"
echo ""

ERRORS=0

check() {
  local path="$PLATFORM/$1"
  if [ -e "$path" ]; then
    echo "  ✓ $1"
  else
    echo "  ✗ MISSING: $1"
    ERRORS=$((ERRORS + 1))
  fi
}

echo "--- Checking RAG Service ---"
check "services/rag-service/rag/embeddings.py"
check "services/rag-service/rag/vector_store.py"
check "services/rag-service/rag/query_engine.py"
check "services/rag-service/llm/krutrim_llm.py"
check "services/rag-service/ingestion/ingest.py"
check "services/rag-service/ingestion/ocr_extractor.py"
check "services/rag-service/ingestion/load_transcription.py"

echo ""
echo "--- Checking FastAPI Backend ---"
check "apps/api/main.py"
check "apps/api/deps.py"
check "apps/api/middleware.py"
check "apps/api/routers/query.py"
check "apps/api/routers/articles.py"
check "apps/api/routers/books.py"
check "apps/api/routers/wisdom.py"
check "apps/api/routers/analytics.py"
check "apps/api/routers/admin.py"
check "apps/api/requirements.txt"

echo ""
echo "--- Checking Shared Packages ---"
check "packages/shared/schemas.py"
check "packages/prompts/rag_prompt.py"
check "packages/prompts/article_prompt.py"

echo ""
echo "--- Checking Article Engine ---"
check "services/article-engine/generator.py"
check "services/article-engine/tasks.py"
check "services/worker/celery_app.py"

echo ""
echo "--- Checking Next.js Frontend ---"
check "apps/web/package.json"
check "apps/web/next.config.ts"
check "apps/web/tailwind.config.ts"
check "apps/web/app/layout.tsx"
check "apps/web/app/page.tsx"
check "apps/web/app/chat/page.tsx"
check "apps/web/app/guru/page.tsx"
check "apps/web/app/blog/page.tsx"
check "apps/web/app/search/page.tsx"
check "apps/web/app/teachings/page.tsx"
check "apps/web/app/admin/page.tsx"
check "apps/web/app/sitemap.ts"
check "apps/web/app/robots.ts"
check "apps/web/components/ChatInterface.tsx"
check "apps/web/components/HeroSection.tsx"
check "apps/web/components/DailyWisdom.tsx"
check "apps/web/components/TopicsGrid.tsx"
check "apps/web/components/ArticleCard.tsx"
check "apps/web/components/WhatsAppCTA.tsx"
check "apps/web/components/Navbar.tsx"
check "apps/web/lib/api.ts"
check "apps/web/lib/useStream.ts"
check "apps/web/styles/globals.css"

echo ""
echo "--- Checking Infrastructure ---"
check "infrastructure/docker-compose.yml"
check "infrastructure/docker/api.Dockerfile"
check "infrastructure/docker/web.Dockerfile"
check "infrastructure/docker/worker.Dockerfile"
check "infrastructure/k8s/api-deployment.yaml"
check "infrastructure/k8s/web-deployment.yaml"
check "infrastructure/k8s/worker-deployment.yaml"
check "infrastructure/k8s/redis-statefulset.yaml"
check "infrastructure/k8s/ingress.yaml"
check "infrastructure/monitoring/prometheus.yml"

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "=== All checks passed! Platform is ready. ==="
  echo ""
  echo "Next steps:"
  echo "  1. Copy .env.example to .env and fill in your credentials"
  echo "  2. cd platform/apps/web && npm install"
  echo "  3. cd platform && docker-compose -f infrastructure/docker-compose.yml up --build"
  echo ""
  echo "  Or run locally:"
  echo "  API:     cd platform && uvicorn apps.api.main:app --reload"
  echo "  Web:     cd platform/apps/web && npm run dev"
  echo "  Worker:  cd platform && celery -A services.worker.celery_app worker --loglevel=info"
else
  echo "=== $ERRORS file(s) missing. Please check the output above. ==="
  exit 1
fi
