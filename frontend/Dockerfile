# Build stage
FROM node:18-bullseye AS build
WORKDIR /app

ARG VITE_API_URL=http://backend:5000
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --legacy-peer-deps ; \
    else \
      npm install --no-audit --no-fund --legacy-peer-deps ; \
    fi

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
