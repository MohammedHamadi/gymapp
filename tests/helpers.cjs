const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Database = require("better-sqlite3");
const root = path.join(__dirname, "..");
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
const day = (offset) => { const d = new Date(today + "T12:00:00"); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

async function harness(t, migrate = true) {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(path.join(root, "electron/db/schema.sql"), "utf8"));
  const context = vm.createContext({ console, Buffer });
  const modules = new Map();
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    let mod;
    if (file === path.join(root, "electron/db/client.js")) {
      mod = new vm.SyntheticModule(["default"], function() { this.setExport("default", db); }, { context, identifier: file });
    } else if (file.startsWith("node:")) {
      const native = require(file);
      mod = new vm.SyntheticModule(Object.keys(native), function() {
        for (const key of Object.keys(native)) this.setExport(key, native[key]);
      }, { context, identifier: file });
    } else {
      mod = new vm.SourceTextModule(fs.readFileSync(file, "utf8"), { context, identifier: file });
    }
    modules.set(file, mod);
    return mod;
  }
  const entry = load(path.join(root, "electron/services/memberService.js"));
  const linker = (specifier, parent) => load(specifier.startsWith("node:") ? specifier : path.resolve(path.dirname(parent.identifier), specifier));
  await entry.link(linker);
  await entry.evaluate();
  async function get(relative) {
    const mod = load(path.join(root, relative));
    if (mod.status === "unlinked") await mod.link(linker);
    if (mod.status === "linked") await mod.evaluate();
    return mod.namespace;
  }
  const state = await get("electron/db/subscriptionState.js");
  if (migrate) state.migrateSubscriptions(db);
  db.exec(`
    INSERT INTO members(id, first_name, last_name, phone, qr_code) VALUES
      ('GYM12345678', 'Test', 'One', '000', 'GYM12345678'),
      ('GYM87654321', 'Test', 'Two', '000', 'GYM87654321');
    INSERT INTO plans(name, type, duration_days, session_count, price, is_active) VALUES
      ('Monthly', 'TIME_BASED', 30, NULL, 2000, 1),
      ('Ten visits', 'SESSION_BASED', NULL, 10, 1500, 1),
      ('Hybrid', 'TIME_BASED', 30, 12, 2500, 1);
  `);
  return {
    db, state, get,
    subs: (await get("electron/repositories/subscriptionRepository.js")).subscriptionRepository,
    members: (await get("electron/repositories/memberRepository.js")).memberRepository,
    access: (await get("electron/services/accessControlService.js")).accessControlService,
    saveMember: entry.namespace.saveMember,
  };
}
const subscription = (extra = {}) => ({
  memberId: "GYM12345678", planId: 2, startDate: today, endDate: null,
  remainingSessions: 10, pricePaid: 1500, status: "ACTIVE", autoRenew: 0, ...extra,
});
const insertLegacy = (db, extra = {}) => {
  const s = subscription(extra);
  return Number(db.prepare(`INSERT INTO subscriptions(member_id,plan_id,start_date,end_date,remaining_sessions,price_paid,status,created_at)
    VALUES (@memberId,@planId,@startDate,@endDate,@remainingSessions,@pricePaid,@status,'2026-01-01 00:00:00')`).run(s).lastInsertRowid);
};


module.exports = { root, today, day, harness, subscription, insertLegacy };
