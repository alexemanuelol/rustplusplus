# ---- Stage 1: Install dependencies ----
FROM node:22-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# ---- Stage 2: Production ----
FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends graphicsmagick \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pm2 \
    && pm2 install pm2-logrotate \
    && pm2 set pm2-logrotate:max_size 10M \
    && pm2 set pm2-logrotate:retain 7 \
    && pm2 set pm2-logrotate:compress true

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json .
COPY index.ts .
COPY src/ ./src/
COPY config/ ./config/
COPY ecosystem.config.js .

VOLUME [ "/app/credentials", "/app/instances", "/app/logs", "/app/maps" ]

CMD ["pm2-runtime", "ecosystem.config.js"]
