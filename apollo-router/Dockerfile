FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@8 && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@8 && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/router.yaml ./router.yaml
COPY --from=builder /app/supergraph.graphql ./supergraph.graphql
COPY --from=builder /app/supergraph-config.yaml ./supergraph-config.yaml

EXPOSE 4000 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["pnpm", "start"]
