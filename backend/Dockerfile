FROM node:18-bullseye
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --no-audit --no-fund --legacy-peer-deps ; \
    else \
      npm install --only=production --no-audit --no-fund --legacy-peer-deps ; \
    fi

COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
