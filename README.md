# Invoice Engine — Self-Hosted CRM

Invoice Engine is a lightweight, self-hosted estimation and invoicing platform built specifically for independent contractors. It replaces scattered PDFs and email threads with cryptographically secure, interactive web documents.

## Features

* **State-Shifting Documents:** Generates a single, secure URL for every estimate. This unified link evolves from an interactive estimate, to a signing portal, and finally into a paid receipt.
* **Service Library Builder:** Construct estimates rapidly using a predefined catalog of your standard services.
* **Native Digital Authorization:** The client portal features an HTML5 Canvas utilizing the Pointer Events API to ensure precise, scroll-locked signature capture on mobile devices.
* **Configuration Gatekeeper:** An automated setup process establishes business identity (Taxation Rates, Payment Terms). A built-in dashboard tracks YTD revenue to monitor tax thresholds.
* **Self-Healing Database:** Built-in SQLite initialization and migrations ensure the application deploys flawlessly without manual database management.

## Tech Stack

* **Runtime:** Node.js 20
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS & shadcn/ui
* **Database:** SQLite (`better-sqlite3` with `WAL` mode)
* **Deployment:** Docker & Docker Compose

---

## 🚀 Quick Start (Docker Production Deployment)

Invoice Engine is designed to be easily deployed on any Linux environment using Docker Compose. The image runs as a secure, non-root user and automatically handles SQLite table creation on boot.

### 1. Prepare the Environment

Because the container runs securely as a non-root user (`nextjs`, UID 1001), you must create the database folder on your host machine and grant it the correct permissions before launching.

```bash
# Create the directory for the project
mkdir -p ~/invoice-engine/server_data

# Grant the container permission to write the SQLite database
sudo chown -R 1001:1001 ~/invoice-engine/server_data

cd ~/invoice-engine
```

### 2. Launch with Docker Compose

You can download the `docker-compose.yml` file from the **Releases** tab, or fetch it directly to your server using the command below:

```bash
# Download the compose file directly from the repository
wget [https://raw.githubusercontent.com/obviously-shadow/invoice-engine/main/docker-compose.yml](https://raw.githubusercontent.com/obviously-shadow/invoice-engine/main/docker-compose.yml)

# Start the application and the auto-updater
docker compose up -d
```

The application will initialize its database and be available at `http://<your-server-ip>:8080`. You will be automatically redirected to the Setup Gatekeeper to configure your business profile.

### Reverse Proxy Considerations (Cloudflare Tunnels)

If exposing this container to the public internet via a Cloudflare Tunnel or Nginx, the `Host` header will not match the client `Origin`, causing the built-in CSRF proxy to reject traffic. 

To resolve this, uncomment and set the `APP_ORIGIN` variable in your downloaded `docker-compose.yml`:

```yaml
environment:
  - RUNNING_IN_DOCKER=true
  - APP_ORIGIN=[https://invoices.yourdomain.com](https://invoices.yourdomain.com)
```

---

## 💻 Local Development Setup

If you wish to modify the code or contribute to the project:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/obviously-shadow/invoice-engine.git](https://github.com/obviously-shadow/invoice-engine.git)
   cd invoice-engine
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run setup

   then

   npm run dev
   ```

Navigate to `http://localhost:3000`. The application will detect it is running locally, bypass Docker pathing, and initialize a local SQLite instance automatically.

---

## Architecture Overview

**Database Persistence:** The application uses a local SQLite database (`engine.db`). In a Docker environment, this is stored in a mounted volume (`./server_data`) to ensure data persists across container rebuilds and Watchtower updates. 

**Security Posture:** * **CSRF Protection:** Integrated proxy verifies `Origin` and `Host` headers for administrative API mutations.
* **Rate Limiting:** Public invoice endpoints are protected by an in-memory IP-based rate limiter to mitigate token brute-forcing.

## License

This project is licensed under the MIT License.
