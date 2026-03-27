# Stage 1: build frontend
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

RUN npm ci --ignore-scripts --legacy-peer-deps && cd client && npm ci --ignore-scripts

COPY .env ./
COPY client/ ./client/
COPY server.js ./
COPY server/ ./server/
COPY assets/ ./assets/

RUN cp .env client/.env && npm run build:client

# Stage 2: production runtime
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps

COPY server.js ./
COPY server/ ./server/
COPY assets/ ./assets/
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]
