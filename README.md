# The Engine: Self-Hosted Invoice & Estimate CRM

A lightweight, high-performance, self-hosted CRM built specifically for independent contractors. Engineered with Next.js 15 (App Router), Tailwind CSS, and `better-sqlite3`.

## Core Features

* **State-Shifting Documents:** Generates a single, cryptographically secure URL for every estimate. This unified link acts as an interactive estimate, a signing portal, and finally a paid receipt.
* **Service Library Builder:** Construct estimates using a predefined catalog of services. The system automatically routes flat-rate prices or calculates labor and material costs.
* **Native Digital Authorization:** The client portal features an HTML5 Canvas utilizing the Pointer Events API to ensure precise, scroll-locked signature capture on mobile devices. Signatures and UTC timestamps are encoded locally.
* **Gatekeeper Configuration:** An initial setup process establishes business identity (Taxation Rates, Payment Terms). A built-in dashboard tracks YTD revenue against the Canadian $30,000 GST/HST threshold.

## Security Posture

* **Database Constraints:** Utilizes `better-sqlite3` with `PRAGMA journal_mode = WAL` and strict Foreign Key enforcement.
* **CSRF Protection:** Integrated middleware verifies `Origin` and `Host` headers for administrative API mutations.
* **Rate Limiting:** Public invoice endpoints are protected by an in-memory IP-based rate limiter to mitigate token brute-forcing.
* **Idempotency Locks:** Signature endpoints validate payload integrity (Base64 format, 2.8MB size cap) and enforce strict SQL state-checks to prevent race conditions.

## Local Development Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Initialize Database**
   \`\`\`bash
   npm run setup
   \`\`\`

3. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

Navigate to `http://localhost:3000`. You will be directed to the Configuration Gatekeeper.

## Docker Production Deployment

This application is designed for containerized deployment on Linux environments. The `Dockerfile` utilizes Alpine Linux, a pinned Node.js runtime, and enforces a non-root system user.

### 1. Preparation
Ensure the host directory for the database volume exists and has appropriate permissions (UID 1001 matches the container's `nextjs` user).

\`\`\`bash
mkdir -p ./server_data
sudo chown -R 1001:1001 ./server_data
\`\`\`

### 2. Build and Deploy
\`\`\`bash
docker compose up -d --build
\`\`\`

### Reverse Proxy Considerations (Cloudflare Tunnels)
If exposing this container via a Cloudflare Tunnel, the `Host` header will not match the client `Origin`, causing the CSRF middleware to reject traffic. To resolve this, pass your expected public URL to the container environment in `docker-compose.yml`:

\`\`\`yaml
environment:
  - APP_ORIGIN=https://invoices.yourdomain.com
\`\`\`

### Backup Strategy
As SQLite stores data on a single volume, configure a host-level cron job to routinely back up the database directory:

\`\`\`bash
0 2 * * * root sqlite3 /path/to/server_data/nepean.db ".backup /backups/nepean-$(date +\\%F).db"
\`\`\`