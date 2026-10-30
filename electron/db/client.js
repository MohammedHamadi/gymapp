import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";
import { fileURLToPath } from "url";
import { upgradeSubscriptions } from "./subscriptionState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the db file is stored in userData for persistence in production
const dbPath = app.isPackaged
  ? path.join(app.getPath("userData"), "gym.db")
  : path.join(__dirname, "../../gym.db");

const db = new Database(dbPath, { 
  verbose: app.isPackaged ? null : console.log 
});
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");

// Initialize Schema
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

upgradeSubscriptions(db, `${dbPath}.before-subscription-fix-${Date.now()}.db`);

export default db;
