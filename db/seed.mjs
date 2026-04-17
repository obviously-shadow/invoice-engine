// db/seed.mjs
import Database from 'better-sqlite3';
const db = new Database('nepean.db');

console.log('🌱 Seeding the database with Nepean Handyman templates...');

const insertTemplate = db.prepare(`
  INSERT INTO job_templates (title, description, default_labor_hours, default_material_cost, hourly_rate)
  VALUES (?, ?, ?, ?, ?)
`);

const templates = [
  ["Drywall Patch (Small)", "Patch, sand, and prep for paint", 1.5, 25.00, 65.00],
  ["TV Mounting (Up to 65\")", "Secure mount to studs, hide cables", 1.0, 45.00, 65.00],
  ["Replace Faucet", "Remove old, install new, test for leaks", 2.0, 15.00, 65.00],
  ["Door Trim Repair", "Remove damaged casing, cut and install new", 1.5, 30.00, 65.00]
];

// Run the inserts
const transaction = db.transaction((items) => {
  for (const item of items) insertTemplate.run(...item);
});

transaction(templates);
console.log('✅ Templates added! You can now delete this seed file if you want.');