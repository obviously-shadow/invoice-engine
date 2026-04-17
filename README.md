# ⚡ The Engine: Self-Hosted Invoice & Estimate CRM

A blazing-fast, highly secure, self-hosted estimation and invoicing tool designed specifically for independent contractors, freelancers, and tradesmen.

Built with **Next.js (App Router)**, **Tailwind CSS**, and **SQLite**.

## 🚀 Features

* **Zero-Friction Estimator:** A "Tap-to-Build" interface designed for mobile use in the field. Build complex estimates without typing a single line item.
* **State-Shifting URLs:** Clients receive a secure, cryptographic "Magic Link". The same link seamlessly shifts from an interactive Estimate to an Approved WIP, to a final Paid Receipt. Zero email chains.
* **Digital Signatures:** Native HTML5 canvas allows clients to legally sign estimates directly on their phone screens.
* **The Command Ledger:** Track YTD revenue, monitor Canadian CRA tax thresholds (GST/HST), and manage all jobs from a pristine Dark Mode dashboard.
* **Zero-Config Deployment:** Uses local SQLite. No complex Docker networks or external database connections required.

## 🛠️ Tech Stack

* **Frontend:** Next.js 15+, React 19, Tailwind CSS, Shadcn UI
* **Backend:** Next.js API Routes (Serverless architecture)
* **Database:** `better-sqlite3` (Lighting fast, local WAL mode)
* **Icons:** Lucide React

## 📦 Installation & Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/yourusername/engine.git
   cd engine
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Initialize the Database:**
   \`\`\`bash
   npm run setup
   \`\`\`

4. **Start the server:**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Initialize your Business:**
   Open `http://localhost:3000` in your browser. You will be automatically redirected to the Setup Wizard to configure your business name and local tax rates.

## 🛡️ Security Note
This application stores your financial data in a local `nepean.db` file. The `.gitignore` prevents this file from being pushed to public repositories. Ensure your server environment backs up this file regularly.