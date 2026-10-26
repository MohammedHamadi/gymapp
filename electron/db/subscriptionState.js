import { localDate } from "../../shared/subscriptionRules.js";

export function expireSubscriptions(db) {
  return db.prepare(`
    UPDATE subscriptions SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' AND (
      (end_date IS NOT NULL AND date(end_date) < @today)
      OR (remaining_sessions IS NOT NULL AND remaining_sessions <= 0)
    )
  `).run({ today: localDate() });
}

const migrationName = "2026-10-single-active-subscription";

export function needsSubscriptionMigration(db) {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
  return !table || !db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?").get(migrationName);
}

export function migrateSubscriptions(db) {
  if (!needsSubscriptionMigration(db)) return;
  db.transaction(() => {
    // Old forms used zero for time-only plans. NULL means unlimited visits.
    db.exec(`
      UPDATE subscriptions SET remaining_sessions = NULL
      WHERE remaining_sessions = 0 AND plan_id IN (
        SELECT id FROM plans WHERE COALESCE(session_count, 0) = 0
      );
    `);
    expireSubscriptions(db);
    // Preserve every historical row and payment; retain the newest active row.
    db.exec(`
      UPDATE subscriptions SET status = 'CANCELLED'
      WHERE status = 'ACTIVE' AND id NOT IN (
        SELECT MAX(id) FROM subscriptions WHERE status = 'ACTIVE' GROUP BY member_id
      );
      CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_member
        ON subscriptions(member_id) WHERE status = 'ACTIVE';
      CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY);
    `);
    db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(migrationName);
  })();
}

export function upgradeSubscriptions(db, backupPath) {
  if (!needsSubscriptionMigration(db)) return false;
  // Includes committed WAL data. A failed backup must stop the upgrade.
  db.prepare("VACUUM INTO ?").run(backupPath);
  migrateSubscriptions(db);
  return true;
}
