# ---- Build stage ----
FROM node:22.23.4-bookworm-slim AS builder

WORKDIR /app

# Use npm (package-lock.json) for reliable installs in CI/build environments
COPY package.json package-lock.json* ./
# Copy workspace package files so npm can install workspace packages and dev deps
COPY frontend/package.json frontend/package-lock.json* frontend/
COPY backend/package.json backend/package-lock.json* backend/
# npm ci installs the lockfile's platform-appropriate optional binaries while
# preventing dependency drift in the production build context.
RUN npm ci --no-audit --no-fund --include=dev

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Serve stage ----
FROM nginx:stable-alpine AS production

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
