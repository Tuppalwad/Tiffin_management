# ============================================================
# Homemade Tiffin Management App - Backend Dockerfile
# Production-ready Node.js 20 Alpine container
# ============================================================

FROM node:20-alpine

# Install curl for container health check
RUN apk add --no-cache curl tzdata

# Set timezone to Asia/Kolkata
ENV TZ=Asia/Kolkata

# Set working directory
WORKDIR /app

# Copy package manifests first for efficient layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Set default production environment
ENV NODE_ENV=production
ENV PORT=5001

# Expose backend port
EXPOSE 5001

# Healthcheck to monitor API availability
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Start backend server
CMD ["node", "src/app.js"]

