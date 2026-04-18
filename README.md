# Invoice Engine — Self-Hosted CRM

Invoice Engine is a lightweight, AI-ready, self-hosted estimation and invoicing platform built specifically for independent contractors. It replaces scattered PDFs and email threads with cryptographically secure, interactive web documents.

## Features

* **State-Shifting Documents:** Generates a single, secure URL for every estimate. This unified link evolves from an interactive estimate, to a signing portal, and finally into a paid receipt.
* **Service Library Builder:** Construct estimates rapidly using a predefined catalog of your services.
* **Native Digital Authorization:** The client portal features an HTML5 Canvas utilizing the Pointer Events API to ensure precise, scroll-locked signature capture on mobile devices.
* **Configuration Gatekeeper:** An automated setup process establishes business identity (Taxation Rates, Payment Terms). A built-in dashboard tracks YTD revenue to monitor tax thresholds.
* **Self-Healing Database:** Built-in SQLite initialization and migrations ensure the application deploys flawlessly without manual database management.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS & shadcn/ui
* **Database:** SQLite (`better-sqlite3` with `WAL` mode)
* **Deployment:** Docker & Docker Compose

## Quick Start (Local Development)

### Prerequisites
* Node.js 20+
* Git

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/obviously-shadow/invoice-engine.git
   cd invoice-engine
   \`\`\`

2. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Navigate to `http://localhost:3000`. The application will automatically initialize the database and redirect you to the Setup Gatekeeper.

## Repository Structure

\`\`\`text
/invoice-engine
├── /app                  # Next.js App Router (API routes and Pages)
│   ├── /admin            # Protected dashboard and document builder
│   ├── /api              # Backend REST endpoints (Invoices, Settings)
│   ├── /p                # Public client-facing invoice routes
│   └── /setup            # Initial configuration gatekeeper
├── /components           # Reusable UI elements (Admin & Client views)
├── /db                   # SQLite initialization scripts
├── /lib                  # Utility functions and database connection logic
├── proxy.ts              # Security middleware (CSRF & Rate Limiting)
├── Dockerfile            # Production image blueprint
└── docker-compose.yml    # Deployment configuration
\`\`\`

## Architecture Overview

**Database Persistence:** The application uses a local SQLite database (`engine.db`). In a Docker environment, this is stored in a mounted volume to ensure data persists across container rebuilds. 

**Security Posture:** * **CSRF Protection:** Integrated proxy verifies `Origin` and `Host` headers for administrative API mutations.
* **Rate Limiting:** Public invoice endpoints are protected by an in-memory IP-based rate limiter to mitigate token brute-forcing.

## Docker Production Deployment

Invoice Engine is designed to be easily deployed on any Linux environment using Docker Compose. The image includes Watchtower support for automatic updates.

### 1. Prepare the Environment
Ensure the host directory for the database volume exists and has the appropriate permissions (UID 1001 matches the container's restricted `nextjs` user).

\`\`\`bash
mkdir -p ~/invoice-engine/server_data
sudo chown -R 1001:1001 ~/invoice-engine/server_data
cd ~/invoice-engine
\`\`\`

### 2. Create `docker-compose.yml`
Create the file on your server and paste the following configuration:

\`\`\`yaml
services:
  engine:
    image: umarkhorami/invoice-engine:latest
    container_name: engine
    restart: unless-stopped
    ports:
      # Maps external port 8080 to internal port 3000
      - "8080:3000"
    volumes:
      - ./server_data:/app/data
    environment:
      - RUNNING_IN_DOCKER=true

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
\`\`\`

### 3. Launch
\`\`\`bash
docker compose up -d
\`\`\`
The application will be available at `http://<your-server-ip>:8080`.

### Reverse Proxy Considerations (Cloudflare Tunnels)
If exposing this container via a Cloudflare Tunnel, the `Host` header will not match the client `Origin`, causing the CSRF proxy to reject traffic. To resolve this, pass your expected public URL to the container environment in `docker-compose.yml`:

\`\`\`yaml
    environment:
      - RUNNING_IN_DOCKER=true
      - APP_ORIGIN=https://invoices.yourdomain.com
\`\`\`

## License
This project is licensed under the MIT License.