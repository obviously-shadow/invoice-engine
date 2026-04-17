FROM node:20.19.1-alpine3.21 AS base

# Install python and build tools required for better-sqlite3 compilation
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy dependency files first
COPY package.json package-lock.json* ./

# FIXED: Added --legacy-peer-deps to handle React 19 + Lucide React compatibility
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Capture the version fingerprint from GitHub Actions
ARG IMAGE_SHA=development
ENV IMAGE_SHA=$IMAGE_SHA

# Set explicit production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# System user setup for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create the data directory and assign ownership to the non-root user
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The start command
CMD ["npm", "start"]