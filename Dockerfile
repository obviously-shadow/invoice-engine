FROM node:20.19.1-alpine3.21 AS base

RUN apk add --no-cache python3 make g++ 

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Capture the version fingerprint from GitHub Actions
ARG IMAGE_SHA=development
ENV IMAGE_SHA=$IMAGE_SHA

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]