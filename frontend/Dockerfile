# --- Stage 1: build the React app ---
FROM node:20-alpine AS builder

WORKDIR /app

# Backend URL is injected at build time so it's baked into the static bundle.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve the static bundle with nginx ---
FROM nginx:1.27-alpine

# SPA fallback + listen on Cloud Run's $PORT
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

# nginx:alpine entrypoint already runs envsubst on /etc/nginx/templates/*.template
CMD ["nginx", "-g", "daemon off;"]
