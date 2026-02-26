import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the db file is stored in userData for persistence in production
const dbPath = app.isPackaged
  ? path.join(app.getPath("userData"), "gym.db")
  : path.join(__dirname, "../../gym.db");

const db = new Database(dbPath, { verbose: console.log });
db.pragma("journal_mode = WAL");

// Initialize Schema
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

export default db;

try {
  db.exec(
    "ALTER TABLE access_logs ADD COLUMN subscription_id INTEGER REFERENCES subscriptions(id)",
  );
} catch {
  // Column already exists, ignore
}

// Add photo column to members if not present
try {
  db.exec("ALTER TABLE members ADD COLUMN photo BLOB");
} catch {
  // Column already exists, ignore
}
