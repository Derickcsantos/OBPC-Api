FROM node:22-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
RUN npm install

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src
COPY tests ./tests
COPY vitest.config.ts ./

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3333

CMD ["node", "dist/src/server.js"]