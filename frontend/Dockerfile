# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build for production (Vite)
RUN npm run build

# --- Runtime stage (static) ---
FROM nginx:1.27-alpine
# Copy a minimal nginx config with SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# Basic healthcheck using curl (installed in the base image)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
