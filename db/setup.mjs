// db/setup.mjs
import Database from 'better-sqlite3';
import fs from 'fs';

// This creates a file called 'nepean.db' in the root of your project
const db = new Database('nepean.db');

console.log('🔨 Building Database Schema...');

db.exec(`
  -- The Client Rolodex
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- The "Job Bundles" (e.g. TV Mounting, Drywall Patch)
  CREATE TABLE IF NOT EXISTS job_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    default_labor_hours REAL DEFAULT 0,
    default_material_cost REAL DEFAULT 0,
    hourly_rate REAL DEFAULT 55.00
  );

  -- The Invoices (The "State-Shifting" Document)
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    token TEXT UNIQUE NOT NULL, -- The massive random string for the URL
    status TEXT DEFAULT 'draft', -- draft, sent, approved, completed, paid
    tax_rate REAL DEFAULT 13.00, -- Ontario HST
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients (id)
  );

  -- The Line Items on the Invoice
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit_price REAL NOT NULL,
    is_taxable BOOLEAN DEFAULT 1,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
  );
`);

console.log('✅ Database built! nepean.db is ready for action.');