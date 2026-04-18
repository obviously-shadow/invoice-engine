FROM node:20.19.1-alpine3.21 AS base

RUN apk add --no-cache python3 make g++ 

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .

ARG IMAGE_SHA=development
ENV IMAGE_SHA=$IMAGE_SHA
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV RUNNING_IN_DOCKER=true

RUN npm run build

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Fix permissions for both the database folder AND the Next.js cache folder
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
RUN chown -R nextjs:nodejs /app/.next

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node db/init.mjs && npm start"]