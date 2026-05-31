FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Production stage ──────────────────────────
FROM nginx:alpine

# Copy built dist
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy both nginx configs
COPY nginx.dev.conf /etc/nginx/nginx.dev.conf
COPY nginx.prod.conf.template /etc/nginx/nginx.prod.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]