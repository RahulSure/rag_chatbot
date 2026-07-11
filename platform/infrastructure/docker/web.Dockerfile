FROM node:20-alpine AS base

# Builder stage (project uses Yarn — yarn.lock is committed)
FROM base AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .

ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SITE_URL=https://shrimali.ai
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# The API isn't running during the image build. Point server-side fetches at an
# absolute (unresolvable-at-build) host so any prerender-time fetch fails FAST with
# ENOTFOUND — caught by the pages' try/catch — instead of hanging on a relative URL.
# At runtime, compose provides the real, resolvable value.
ENV API_INTERNAL_URL=http://api:8000

RUN yarn build

# Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
# Bind to all interfaces so nginx (another container) can reach the standalone server.
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
