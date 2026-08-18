# Stage 1: build frontend
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

RUN npm ci --ignore-scripts --legacy-peer-deps && cd client && npm ci --ignore-scripts

COPY client/ ./client/
COPY server.js ./
COPY server/ ./server/
COPY assets/ ./assets/

# Only the public VITE_* keys are needed at build time (Vite embeds them into
# the client bundle). Never COPY the full .env here — it also holds
# server-only secrets (Firebase Admin key, R2, Stripe, Mongo URI) that must
# not end up baked into any image layer or build cache.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET

RUN npm run build:client

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
