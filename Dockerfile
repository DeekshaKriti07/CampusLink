FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=5001
WORKDIR /app/backend
COPY --from=backend --chown=node:node /app/backend/package*.json ./
COPY --from=backend --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=backend --chown=node:node /app/backend/dist ./dist
COPY --from=backend --chown=node:node /app/backend/prisma ./prisma
COPY --from=frontend --chown=node:node /app/frontend/dist /app/frontend/dist
USER node
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5001)+'/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npm run db:migrate && npm start"]
