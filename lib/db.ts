// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

// Locate the nepean.db file in the root of your project
const dbPath = path.resolve(process.cwd(), 'nepean.db');
const db = new Database(dbPath);

// This makes SQLite run insanely fast by allowing concurrent reads/writes
db.pragma('journal_mode = WAL');

export default db;