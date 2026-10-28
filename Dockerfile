FROM node:26.12-alpine3.23 AS base

WORKDIR /src

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV PNPM_VERSION=12.16.1

RUN wget -qO- https://get.pnpm.io | env ENV="$HOME/.shrc" SHELL="$(which sh)" sh -

COPY package*.json pnpm*.yaml ./
RUN pnpm install --frozen-lockfile

COPY app ./app
COPY public ./public
COPY server ./server
COPY shared ./shared
COPY tsconfig.json nuxt.config.ts prisma7.config.ts ./
COPY prisma ./prisma

RUN pnpm exec prisma generate

# Développement

FROM base AS dev

EXPOSE 3000
CMD ["pnpm", "run", "nuxt:dev"]

# Build production

FROM base AS build

RUN pnpm nuxt:build

# Lancement production

FROM node:26.12-alpine3.23 AS prod

WORKDIR /src
COPY --from=build /src/.output ./.output

EXPOSE 3000
ENV NODE_ENV=production

USER node

CMD ["node", ".output/server/index.mjs"]
