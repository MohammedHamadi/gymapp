const migrationName = "2026-11-archive-members-and-safe-checkout";

export function needsOperationalMigration(db) {
  const table = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
  return !table || !db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?").get(migrationName);
}

export function migrateOperations(db) {
  if (!needsOperationalMigration(db)) return;
  db.transaction(() => {
    const columns = db.prepare("PRAGMA table_info(members)").all().map(column => column.name);
    if (!columns.includes("is_archived")) {
      db.exec("ALTER TABLE members ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0");
    }
    if (!columns.includes("archived_at")) {
      db.exec("ALTER TABLE members ADD COLUMN archived_at DATETIME");
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS sales_checkouts (
        id TEXT PRIMARY KEY,
        request_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS access_logs_member_movement ON access_logs(member_id, id DESC);
      CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY);
      UPDATE products SET is_active = 1 WHERE is_active IS NULL;
    `);
    db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(migrationName);
  })();
}

export function upgradeOperations(db, backupPath, backupAlreadyCreated = false) {
  if (!needsOperationalMigration(db)) return false;
  if (!backupAlreadyCreated) db.prepare("VACUUM INTO ?").run(backupPath);
  migrateOperations(db);
  return true;
}
