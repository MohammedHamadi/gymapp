const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Database = require("better-sqlite3");
const { transformSync } = require("esbuild");
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

test("both filters restore saved selections, survive remount and handle broken storage", () => {
  const source = fs.readFileSync(path.join(root, "src/app/hooks/useStatusFilter.ts"), "utf8");
  const code = transformSync(source, { loader: "ts", format: "cjs" }).code;
  const values = new Map();
  let state;
  const context = {
    module: { exports: {} },
    localStorage: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) },
    require: () => ({
      useState: (init) => { if (state === undefined) state = init(); return [state, (value) => { state = value; }]; },
      useEffect: (fn) => fn(),
    }),
  };
  vm.runInNewContext(code, context);
  const use = context.module.exports.useStatusFilter;
  const allowed = ["ALL", "ACTIVE", "CANCELLED", "NOT_CANCELLED"];
  for (const key of ["gym_members_status_filter", "gym_subscriptions_status_filter"]) {
    state = undefined;
    assert.equal(use(key, allowed)[0], "ALL");
    use(key, allowed)[1]("NOT_CANCELLED");
    assert.equal(use(key, allowed)[0], "NOT_CANCELLED");
    state = undefined; // A fresh mount reads the persisted selection.
    assert.equal(use(key, allowed)[0], "NOT_CANCELLED");
    use(key, allowed)[1]("CANCELLED");
    use(key, allowed);
    state = undefined;
    assert.equal(use(key, allowed)[0], "CANCELLED");
    values.set(key, "corrupt");
    state = undefined;
    assert.equal(use(key, allowed)[0], "ALL");
    assert.equal(values.get(key), "ALL");
  }
  context.localStorage.getItem = () => { throw Error("blocked"); };
  context.localStorage.setItem = () => { throw Error("blocked"); };
  state = undefined;
  assert.equal(use("test", allowed)[0], "ALL");
});

test("same-plan renewal immediately replaces sessions and records one new payment", async (t) => {
  const { db, subs } = await harness(t);
  const first = Number(subs.create(subscription()).lastInsertRowid);
  subs.decrementSession(first);
  const second = Number(subs.renew("GYM12345678", subscription()).lastInsertRowid);
  assert.equal(subs.findById(first).status, "CANCELLED");
  assert.equal(subs.findById(second).remaining_sessions, 10);
  assert.equal(subs.findActiveByMemberId("GYM12345678").length, 1);
  assert.equal(db.prepare("SELECT SUM(amount) total FROM transactions").get().total, 3000);
});

test("switching plans replaces every active subscription and preserves printed identity", async (t) => {
  const { db, subs, members, access } = await harness(t);
  const original = members.findById("GYM12345678");
  const first = Number(subs.create(subscription()).lastInsertRowid);
  const latest = Number(subs.renew(original.id, subscription({ planId: 1, endDate: day(30), remainingSessions: null, pricePaid: 2000 })).lastInsertRowid);
  assert.equal(subs.findById(first).status, "CANCELLED");
  const after = members.findById(original.id);
  assert.equal(after.id, original.id);
  assert.equal(after.qr_code, original.qr_code);
  assert.equal(access.handleAccessRequest(original.id, "CHECK_IN").subscription.id, latest);
  assert.equal(members.findAll()[0].subscription.id, latest);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM subscriptions WHERE status='ACTIVE'").get().n, 1);
});

test("create, edit, reactivation and raw SQL cannot give a member two active subscriptions", async (t) => {
  const { db, subs } = await harness(t);
  const old = Number(subs.create(subscription({ status: "CANCELLED" })).lastInsertRowid);
  subs.create(subscription());
  assert.throws(() => subs.create(subscription({ planId: 3, endDate: day(30) })), /already has an active/);
  assert.throws(() => subs.updateStatus(old, "ACTIVE"), /already has an active/);
  assert.throws(() => subs.update(old, subscription()), /already has an active/);
  assert.throws(() => insertLegacy(db), /UNIQUE/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM transactions").get().n, 2);
});

test("failed renewal rolls back the cancellation, new row and payment", async (t) => {
  const { db, subs } = await harness(t);
  const old = Number(subs.create(subscription()).lastInsertRowid);
  db.exec("CREATE TRIGGER fail_payment BEFORE INSERT ON transactions BEGIN SELECT RAISE(ABORT, 'payment failed'); END;");
  assert.throws(() => subs.renew("GYM12345678", subscription()), /payment failed/);
  assert.equal(subs.findById(old).status, "ACTIVE");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM subscriptions").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM transactions").get().n, 1);
});

test("new member and first subscription save atomically with a stable barcode", async (t) => {
  const { db, saveMember, members } = await harness(t);
  const member = { firstName: "New", lastName: "Member", phone: "123" };
  assert.throws(() => saveMember({ member, subscription: subscription({ planId: 999 }) }), /active, existing plan/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM members").get().n, 2);
  const saved = saveMember({ member, subscription: subscription() });
  assert.match(saved.id, /^GYM\d{8}$/);
  assert.equal(saved.qrCode, saved.id);
  saveMember({ member: { ...saved, firstName: "Edited" }, subscriptionId: saved.subscription.id, subscription: subscription() });
  assert.equal(members.findById(saved.id).qr_code, saved.id);
});

test("member edits roll back personal details when the subscription edit fails", async (t) => {
  const { saveMember, members, subs } = await harness(t);
  const id = Number(subs.create(subscription()).lastInsertRowid);
  assert.throws(() => saveMember({
    member: { id: "GYM12345678", firstName: "Changed", lastName: "One", phone: "000" },
    subscriptionId: id, subscription: subscription({ pricePaid: -1 }),
  }), /Price/);
  assert.equal(members.findById("GYM12345678").first_name, "Test");
});

test("member selection uses the active subscription, with an ID tie-break for same-second renewals", async (t) => {
  const { db, members } = await harness(t);
  const active = insertLegacy(db);
  insertLegacy(db, { status: "CANCELLED" });
  assert.equal(members.findByIdWithSubscription("GYM12345678").subscription.id, active);
  assert.equal(members.findByIdWithSubscription("GYM12345678").subscription.planId, 2);
  assert.equal(members.findByIdWithSubscription("GYM12345678").subscription.pricePaid, 1500);
});

test("time-only subscriptions permit unlimited visits, including on the expiry date", async (t) => {
  const { subs, access } = await harness(t);
  const id = Number(subs.create(subscription({ planId: 1, endDate: today, remainingSessions: 0 })).lastInsertRowid);
  assert.equal(subs.findById(id).remaining_sessions, null);
  for (let i = 0; i < 3; i++) {
    const result = access.handleAccessRequest("GYM12345678", "CHECK_IN");
    assert.equal(result.status, "GRANTED");
    assert.equal(result.subscription.remainingSessions, null);
  }
});

test("expired dates, future starts and exhausted plans are denied consistently", async (t) => {
  const { subs, access } = await harness(t);
  subs.create(subscription({ planId: 1, startDate: day(-30), endDate: day(-1), remainingSessions: null }));
  assert.equal(access.handleAccessRequest("GYM12345678", "CHECK_IN").status, "DENIED");
  assert.equal(subs.getStats().expiredCount, 1);
  const future = Number(subs.renew("GYM12345678", subscription({ startDate: day(1) })).lastInsertRowid);
  assert.match(access.handleAccessRequest("GYM12345678", "CHECK_IN").reason, /not started/);
  assert.equal(subs.getStats().activeCount, 0);
  subs.updateStatus(future, "CANCELLED");
  const last = Number(subs.renew("GYM12345678", subscription({ remainingSessions: 1 })).lastInsertRowid);
  assert.equal(access.handleAccessRequest("GYM12345678", "CHECK_IN").subscription.remainingSessions, 0);
  assert.equal(subs.findById(last).status, "EXPIRED");
  assert.equal(access.handleAccessRequest("GYM12345678", "CHECK_IN").status, "DENIED");
  assert.throws(() => subs.updateStatus(last, "ACTIVE"), /Renew it first/);
});

test("session deduction and access logging roll back together", async (t) => {
  const { db, subs, access } = await harness(t);
  const id = Number(subs.create(subscription()).lastInsertRowid);
  db.exec("CREATE TRIGGER fail_log BEFORE INSERT ON access_logs BEGIN SELECT RAISE(ABORT, 'log failed'); END;");
  assert.throws(() => access.handleAccessRequest("GYM12345678", "CHECK_IN"), /log failed/);
  assert.equal(subs.findById(id).remaining_sessions, 10);
});

test("subscription edits cannot reassign a member or plan and price corrections agree with payments", async (t) => {
  const { db, subs } = await harness(t);
  const id = Number(subs.create(subscription()).lastInsertRowid);
  assert.throws(() => subs.update(id, subscription({ memberId: "GYM87654321" })), /cannot be changed/);
  assert.throws(() => subs.update(id, subscription({ planId: 3, endDate: day(30) })), /cannot be changed/);
  subs.update(id, subscription({ pricePaid: 1000 }));
  assert.equal(subs.getStats().monthlyRevenue, 1000);
  assert.equal(db.prepare("SELECT amount FROM transactions WHERE subscription_id = ?").get(id).amount, 1000);
});

test("invalid money, sessions, dates, missing members and inactive plans fail without payments", async (t) => {
  const { db, subs } = await harness(t);
  for (const extra of [
    { pricePaid: -1 }, { pricePaid: NaN }, { pricePaid: null }, { remainingSessions: 1.5 },
    { remainingSessions: -1 }, { remainingSessions: null }, { startDate: "2026-02-30" },
    { startDate: "" }, { endDate: day(-1) }, { memberId: "missing" }, { planId: 999 },
    { status: "BAD" },
  ]) assert.throws(() => subs.create(subscription(extra)));
  db.exec("UPDATE plans SET is_active = 0 WHERE id = 2");
  assert.throws(() => subs.renew("GYM12345678", subscription()), /active, existing plan/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM transactions").get().n, 0);
});

test("AZERTY and QWERTY scans resolve the same printed ID; checkout never consumes a session", async (t) => {
  const { subs, access } = await harness(t);
  const id = Number(subs.create(subscription()).lastInsertRowid);
  for (const code of ["GYM12345678", "gym12345678\r\n", "GY:!@#$%^&*", 'GY?&é"\'(-è_']) {
    assert.equal(access.handleAccessRequest(code, "CHECK_IN").status, "GRANTED", code);
  }
  assert.equal(subs.findById(id).remaining_sessions, 6);
  assert.equal(access.handleAccessRequest("GYM12345678", "CHECK_OUT").status, "GRANTED");
  assert.equal(subs.findById(id).remaining_sessions, 6);
});

test("ambiguous keyboard scans never charge either member", async (t) => {
  const { db, subs, access } = await harness(t);
  db.exec(`INSERT INTO members(id,first_name,last_name,phone,qr_code) VALUES
    ('GYM11111111','A','A','0','GYM11111111'), ('GYM77777777','B','B','0','GYM77777777');`);
  subs.create(subscription({ memberId: "GYM11111111" }));
  subs.create(subscription({ memberId: "GYM77777777" }));
  assert.match(access.handleAccessRequest("GYM&&&&&&&&", "CHECK_IN").reason, /Ambiguous/);
  assert.equal(subs.findActiveByMemberId("GYM11111111")[0].remaining_sessions, 10);
  assert.equal(subs.findActiveByMemberId("GYM77777777")[0].remaining_sessions, 10);
});

test("upgrade repairs duplicates and unlimited visits without deleting history; migration is repeatable", async (t) => {
  const { db, state, members } = await harness(t, false);
  const first = insertLegacy(db);
  const latest = insertLegacy(db, { planId: 3, endDate: day(30) });
  insertLegacy(db, { memberId: "GYM87654321", planId: 1, endDate: day(30), remainingSessions: 0 });
  db.prepare("INSERT INTO transactions(member_id,subscription_id,amount,type) VALUES ('GYM12345678',?,1500,'SUBSCRIPTION')").run(first);
  state.migrateSubscriptions(db);
  assert.equal(db.prepare("SELECT status FROM subscriptions WHERE id = ?").get(first).status, "CANCELLED");
  assert.equal(members.findByIdWithSubscription("GYM12345678").subscription.id, latest);
  assert.equal(db.prepare("SELECT remaining_sessions FROM subscriptions WHERE member_id = 'GYM87654321'").get().remaining_sessions, null);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM subscriptions").get().n, 3);
  assert.equal(db.prepare("SELECT SUM(amount) total FROM transactions").get().total, 1500);
  state.migrateSubscriptions(db);
  assert.equal(state.needsSubscriptionMigration(db), false);
  assert.throws(() => insertLegacy(db), /UNIQUE/);
});

test("plan history is protected and session-only plan creation accepts null duration", async (t) => {
  const { get, subs } = await harness(t);
  const plans = (await get("electron/repositories/planRepository.js")).planRepository;
  const info = plans.create({ name: "Visits only", type: "SESSION_BASED", duration_days: null, session_count: 5, price: 1000, is_active: 1 });
  assert.equal(plans.findById(Number(info.lastInsertRowid)).duration_days, null);
  subs.create(subscription());
  assert.throws(() => plans.delete(2), /Deactivate/);
});

test("renewal defaults reset visits and use local calendar dates across DST changes", async (t) => {
  const { get } = await harness(t);
  const rules = await get("shared/subscriptionRules.js");
  const values = rules.renewalValues({ duration_days: 30, session_count: 10 }, "2026-10-26");
  assert.equal(values.startDate, "2026-10-26");
  assert.equal(values.endDate, "2026-11-25");
  assert.equal(values.remainingSessions, 10);
  assert.equal(rules.addDays("2026-03-28", 2), "2026-03-30");
  assert.equal(rules.isDate("2026-02-30"), false);
});

test("upgrade writes a complete backup before changing legacy subscriptions", async (t) => {
  const { db, state } = await harness(t, false);
  const first = insertLegacy(db);
  insertLegacy(db, { planId: 3, endDate: day(30) });
  const folder = path.join(root, "test-results");
  fs.mkdirSync(folder, { recursive: true });
  const backupPath = path.join(folder, `upgrade-${process.pid}.db`);
  t.after(() => { if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath); });
  assert.equal(state.upgradeSubscriptions(db, backupPath), true);
  const backup = new Database(backupPath, { readonly: true });
  try {
    assert.equal(backup.prepare("SELECT COUNT(*) n FROM subscriptions WHERE status='ACTIVE'").get().n, 2);
    assert.equal(backup.prepare("SELECT status FROM subscriptions WHERE id=?").get(first).status, "ACTIVE");
  } finally { backup.close(); }
  assert.equal(db.prepare("SELECT COUNT(*) n FROM subscriptions WHERE status='ACTIVE'").get().n, 1);
  assert.equal(state.upgradeSubscriptions(db, backupPath), false);
});

test("a failed backup leaves legacy subscriptions unchanged", async (t) => {
  const { db, state } = await harness(t, false);
  insertLegacy(db);
  insertLegacy(db);
  assert.throws(() => state.upgradeSubscriptions(db, path.join(root, "test-results", "missing-folder", "backup.db")));
  assert.equal(db.prepare("SELECT COUNT(*) n FROM subscriptions WHERE status='ACTIVE'").get().n, 2);
  assert.equal(state.needsSubscriptionMigration(db), true);
});

test("immediate scan after renewal grants access without locking or declining", async (t) => {
  const { subs, access } = await harness(t);
  subs.create(subscription({ planId: 1, startDate: today, endDate: day(30), remainingSessions: null }));
  const scanBefore = access.handleAccessRequest("GYM12345678", "CHECK_IN");
  assert.equal(scanBefore.status, "GRANTED");

  // Perform a renewal
  subs.renew("GYM12345678", subscription({ planId: 1, startDate: today, endDate: day(30), remainingSessions: null }));

  // Immediately scan same member
  const scanAfterSame = access.handleAccessRequest("GYM12345678", "CHECK_IN");
  assert.equal(scanAfterSame.status, "GRANTED");

  // Immediately scan another member with an active plan
  subs.create(subscription({ memberId: "GYM87654321", planId: 2, startDate: today, endDate: null, remainingSessions: 5 }));
  const scanOther = access.handleAccessRequest("GYM87654321", "CHECK_IN");
  assert.equal(scanOther.status, "GRANTED");
  assert.equal(scanOther.subscription.remainingSessions, 4);
});

