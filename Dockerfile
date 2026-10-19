FROM node:26.12-alpine3.23 AS base

WORKDIR /src
COPY package*.json pnpm*.yaml ./

RUN npm install -g corepack && corepack enable

RUN pnpm install --frozen-lockfile

COPY app ./app
COPY public ./public
COPY server ./server
COPY shared ./shared
COPY tsconfig.json nuxt.config.ts ./

# Développement
FROM base AS dev

EXPOSE 3000
CMD ["pnpm", "run", "nuxt:dev"]

# Build production
FROM base AS build

RUN pnpm build

# Lancement production

FROM node:26.12-alpine3.23 AS prod

WORKDIR /src
COPY --from=build /src/.output ./.output

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
