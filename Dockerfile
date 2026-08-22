# Single deployable unit: the API process serves both the JSON API and the built React app.
# Build:  docker build -t locatex .
# Run:    docker run -p 8080:8080 --env-file .env locatex

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# ---- dependencies (cached until a manifest changes) -------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN pnpm --filter @locatex/contracts build \
 && pnpm --filter @locatex/web build \
 && pnpm --filter @locatex/api build

# ---- runtime: production dependencies plus the two build outputs ------------
FROM base AS runtime
ENV NODE_ENV=production SERVE_WEB=true PORT=8080
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @locatex/api... 

COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/migrations apps/api/migrations
COPY --from=build /app/apps/api/migrate-mongo-config.cjs apps/api/
COPY --from=build /app/apps/web/dist apps/web/dist

USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# The worker runs from the same image with:  docker run … node apps/api/dist/worker.js
CMD ["node", "apps/api/dist/server.js"]
