import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
const dbDir = isDocker ? '/app/data' : process.cwd();
const dbPath = path.join(dbDir, 'engine.db');

if (isDocker && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    default_labor_hours REAL DEFAULT 0,
    default_material_cost REAL DEFAULT 0,
    hourly_rate REAL DEFAULT 55.00
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT DEFAULT 'New Client',
    client_email TEXT DEFAULT '',
    client_address TEXT DEFAULT '',
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'draft',
    tax_rate REAL DEFAULT 13.00,
    notes TEXT,
    signature_data TEXT,
    signed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    qty REAL DEFAULT 1,
    rate REAL NOT NULL,
    total REAL NOT NULL,
    is_taxable BOOLEAN DEFAULT 1,
    is_tbd BOOLEAN DEFAULT 0,
    group_name TEXT DEFAULT '',
    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL DEFAULT 'My Company',
    business_number TEXT DEFAULT '',
    business_phone TEXT DEFAULT '',
    business_email TEXT DEFAULT '',
    business_website TEXT DEFAULT '',
    business_address TEXT DEFAULT '',
    tax_rate REAL NOT NULL DEFAULT 13.00,
    payment_terms TEXT DEFAULT 'Net 30',
    require_signature BOOLEAN NOT NULL DEFAULT 0,
    is_setup BOOLEAN NOT NULL DEFAULT 0
  );
`);

// Graceful auto-migrations for existing databases
try { db.exec("ALTER TABLE invoice_items ADD COLUMN is_tbd BOOLEAN DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE invoice_items ADD COLUMN group_name TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE invoices ADD COLUMN is_tbd BOOLEAN DEFAULT 0"); } catch (e) {}

const insertSettings = db.prepare(`
  INSERT OR IGNORE INTO settings (
    id, company_name, business_number, business_phone, business_email, 
    business_website, business_address, tax_rate, payment_terms, require_signature, is_setup
  ) VALUES (
    1, 'The Engine', '', '', '', '', '', 13.00, 'Net 30', 0, 0
  )
`);
insertSettings.run();

export default db;