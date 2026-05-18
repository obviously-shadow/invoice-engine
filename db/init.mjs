import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

console.log('Starting Database Initialization...');

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
const dbDir = isDocker ? '/app/data' : process.cwd();

if (isDocker && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'engine.db');
const db = new Database(dbPath, { timeout: 10000 });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 10000');

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_tbd BOOLEAN DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    display_number INTEGER,
    due_date TEXT DEFAULT '',
    deposit_amount REAL DEFAULT 0
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

  CREATE TABLE IF NOT EXISTS invoice_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT DEFAULT 'Transfer',
    notes TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    is_setup BOOLEAN NOT NULL DEFAULT 0,
    password_hash TEXT,
    tax_threshold REAL DEFAULT 30000.00
  );

  CREATE TABLE IF NOT EXISTS material_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT DEFAULT 'New Client',
    client_email TEXT DEFAULT '',
    client_address TEXT DEFAULT '',
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'draft',
    tax_rate REAL DEFAULT 13.00,
    notes TEXT,
    sourcing_fee REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT 0,
    display_number INTEGER,
    total_cost REAL DEFAULT 0,
    deposit_amount REAL DEFAULT 0,
    signature_data TEXT,
    signed_at DATETIME DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS material_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    qty REAL DEFAULT 1,
    cost REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES material_receipts (id) ON DELETE CASCADE
  );
`);

// Bulletproof Safe Migrations (Checks if column exists before altering to prevent crashes)
const ensureColumn = (table, column, definition) => {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (e) {
    console.error(`Migration failed for ${table}.${column}:`, e);
  }
};

ensureColumn('invoice_items', 'is_tbd', 'BOOLEAN DEFAULT 0');
ensureColumn('invoice_items', 'group_name', "TEXT DEFAULT ''");
ensureColumn('invoices', 'is_tbd', 'BOOLEAN DEFAULT 0');
ensureColumn('invoices', 'is_archived', 'BOOLEAN DEFAULT 0');
ensureColumn('invoices', 'display_number', 'INTEGER');
ensureColumn('invoices', 'due_date', "TEXT DEFAULT ''");
ensureColumn('invoices', 'deposit_amount', 'REAL DEFAULT 0');
ensureColumn('settings', 'password_hash', 'TEXT');
ensureColumn('settings', 'tax_threshold', 'REAL DEFAULT 30000.00');

ensureColumn('material_receipts', 'is_archived', 'BOOLEAN DEFAULT 0');
ensureColumn('material_receipts', 'display_number', 'INTEGER');
ensureColumn('material_receipts', 'total_cost', 'REAL DEFAULT 0');
ensureColumn('material_receipts', 'markup_percentage', 'REAL DEFAULT 0'); // Legacy
ensureColumn('material_receipts', 'sourcing_fee', 'REAL DEFAULT 0');
ensureColumn('material_receipts', 'deposit_amount', 'REAL DEFAULT 0');
ensureColumn('material_receipts', 'tax_rate', 'REAL DEFAULT 13.00');
ensureColumn('material_receipts', 'status', "TEXT DEFAULT 'draft'");
ensureColumn('material_receipts', 'signature_data', 'TEXT');
ensureColumn('material_receipts', 'signed_at', 'DATETIME DEFAULT NULL');

const insertSettings = db.prepare(`
  INSERT OR IGNORE INTO settings (
    id, company_name, business_number, business_phone, business_email, 
    business_website, business_address, tax_rate, payment_terms, require_signature, is_setup
  ) VALUES (
    1, 'The Engine', '', '', '', '', '', 13.00, 'Net 30', 0, 0
  )
`);
insertSettings.run();

console.log('Database initialization complete. Ready for production.');