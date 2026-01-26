# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build untuk production
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

# Copy built files dari stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (opsional, untuk Vue Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]