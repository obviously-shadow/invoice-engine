import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// If we are in production (Docker), force the path to the mounted volume
const isProd = process.env.NODE_ENV === 'production';
const dbDir = isProd ? '/app/data' : process.cwd();
const dbPath = path.join(dbDir, 'nepean.db');

// Ensure the directory exists in production before SQLite tries to open it
if (isProd && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;