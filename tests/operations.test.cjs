const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");
const Database = require("better-sqlite3");
const { transformSync } = require("esbuild");
const { root, harness, subscription, day } = require("./helpers.cjs");

async function shop(t, stock = 5, price = 100) {
  const h = await harness(t);
  const products = await h.get("electron/repositories/productRepository.js");
  const sales = await h.get("electron/repositories/salesHistoryRepository.js");
  const product = products.createProduct({ name: "Water", price, type: "Product", stock, is_active: 1 });
  return { ...h, products, sales, product };
}
const line = (product, quantity = 1, extra = {}) => ({
  product_id: product.id, member_id: "GYM12345678", quantity,
  unit_price: product.price, total_price: Math.round(product.price * 100) * quantity / 100,
  payment_method: "Cash", ...extra,
});

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object" ? text(node.props?.children) : String(node ?? "");
}
function mountSales(h, quantity = 3, loseFirstResponse = false) {
  let stateCursor = 0, refCursor = 0;
  const states = [
    h.products.getAllProducts(), "", [], h.members.findAll(), false, null,
    [{ ...h.product, quantity }], false, "Cash", "GYM12345678", null, false, null,
    { name: "", price: "", type: "Product", stock: "10" },
  ];
  const refs = [];
  const requests = [];
  const alerts = [];
  let loseResponse = loseFirstResponse;
  const react = {
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useRef(initial) {
      const index = refCursor++;
      return refs[index] ||= { current: initial };
    },
    useEffect() {},
  };
  const elements = new Proxy({}, { get: (_object, name) => name });
  const element = (type, props) => ({ type, props });
  const context = vm.createContext({
    module: { exports: {} }, crypto: { randomUUID },
    console: { error() {} }, alert: message => alerts.push(message),
    require: name => name === "react" ? react
      : name === "react/jsx-runtime" ? { jsx: element, jsxs: element } : elements,
    window: { api: {
      products: { getAll: async () => h.products.getAllProducts() },
      members: { getAll: async () => h.members.findAll() },
      sales: {
        getRecent: async () => h.sales.getRecentSales(10),
        createBatch: async (cart, requestId) => {
          requests.push({ cart, requestId });
          const result = h.sales.createSalesBatch(cart, requestId);
          if (loseResponse) { loseResponse = false; throw Error("Response lost"); }
          return result;
        },
      },
    } },
  });
  const source = transformSync(fs.readFileSync(path.join(root, "src/app/components/SalesPage.tsx"), "utf8"), {
    loader: "tsx", format: "cjs", jsx: "automatic",
  }).code;
  vm.runInContext(source, context);
  const render = () => { stateCursor = 0; refCursor = 0; return context.module.exports.SalesPage(); };
  const checkout = () => nodes(render()).find(node => typeof node.props?.onClick === "function"
    && (text(node).includes("Complete Sale") || text(node).includes("Processing...")));
  return { states, requests, alerts, render, checkout };
}

test("checkout stores and prints quantity totals, actual customer and deducted stock", async t => {
  const h = await shop(t);
  const ui = mountSales(h);
  await ui.checkout().props.onClick();
  const stored = h.db.prepare("SELECT * FROM sales_history").get();
  assert.equal(stored.quantity, 3);
  assert.equal(stored.total_price, 300);
  assert.equal(h.products.getProductById(h.product.id).stock, 2);
  assert.equal(ui.states[5].total, 300);
  assert.equal(ui.states[5].items[0].total_price, 300);
  assert.equal(ui.states[5].memberName, "Test One");
  assert.ok(nodes(ui.render()).some(node => text(node) === "300 DZD"));
  assert.equal(ui.alerts.length, 0);
});

test("checkout guard prevents concurrent clicks and disables submission", async t => {
  const h = await shop(t);
  const ui = mountSales(h, 1);
  const button = ui.checkout();
  const first = button.props.onClick();
  assert.equal(ui.checkout().props.disabled, true);
  const duplicate = button.props.onClick();
  await Promise.all([first, duplicate]);
  assert.equal(ui.requests.length, 1);
  assert.equal(h.sales.getAllSales().length, 1);
  assert.equal(h.products.getProductById(h.product.id).stock, 4);
});

test("retry after losing a committed checkout response reuses its ID and receipt", async t => {
  const h = await shop(t);
  const ui = mountSales(h, 3, true);
  await ui.checkout().props.onClick();
  assert.equal(ui.states[6].length, 1);
  assert.equal(ui.alerts.length, 1);
  await ui.checkout().props.onClick();
  assert.equal(ui.requests.length, 2);
  assert.equal(ui.requests[0].requestId, ui.requests[1].requestId);
  assert.equal(h.sales.getAllSales().length, 1);
  assert.equal(h.products.getProductById(h.product.id).stock, 2);
  assert.equal(ui.states[5].total, 300);
  assert.equal(ui.states[6].length, 0);
});

test("zero stock, insufficient stock, archived products and members reject sales", async t => {
  const h = await shop(t, 0);
  assert.throws(() => h.sales.createSalesBatch([line(h.product)]), /stock/);
  h.products.updateProduct(h.product.id, { ...h.product, stock: 2 });
  assert.throws(() => h.sales.createSalesBatch([line(h.product, 3)]), /stock/);
  h.products.updateProduct(h.product.id, { ...h.product, stock: 5, is_active: 0 });
  assert.throws(() => h.sales.createSale(line(h.product)), /no longer available/);
  h.products.updateProduct(h.product.id, { ...h.product, stock: 5, is_active: 1 });
  h.members.delete("GYM12345678");
  assert.throws(() => h.sales.createSale(line(h.product)), /member.*no longer available/);
  assert.equal(h.sales.getAllSales().length, 0);
  assert.equal(h.products.getProductById(h.product.id).stock, 5);
});

test("an unavailable later cart item rolls back earlier deductions and sales", async t => {
  const h = await shop(t);
  const unavailable = h.products.createProduct({ name: "Empty", price: 100, type: "Product", stock: 0 });
  assert.throws(() => h.sales.createSalesBatch([line(h.product), line(unavailable)], "partial-cart"), /stock/);
  assert.equal(h.products.getProductById(h.product.id).stock, 5);
  assert.equal(h.sales.getAllSales().length, 0);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM sales_checkouts").get().n, 0);
  assert.throws(() => h.sales.createSalesBatch([line(h.product, 3), line(h.product, 3)]), /stock/);
  assert.equal(h.products.getProductById(h.product.id).stock, 5);
});

test("a failed sale write restores stock and allows a safe retry with the same ID", async t => {
  const h = await shop(t);
  h.db.exec("CREATE TRIGGER fail_sale BEFORE INSERT ON sales_history BEGIN SELECT RAISE(ABORT, 'sale failed'); END;");
  assert.throws(() => h.sales.createSalesBatch([line(h.product)], "retry-1"), /sale failed/);
  assert.equal(h.products.getProductById(h.product.id).stock, 5);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM sales_checkouts").get().n, 0);
  h.db.exec("DROP TRIGGER fail_sale");
  h.sales.createSalesBatch([line(h.product)], "retry-1");
  assert.equal(h.sales.getAllSales().length, 1);
});

test("backend rejects incorrect quotes, stale prices and invalid quantities without deduction", async t => {
  const h = await shop(t);
  for (const quantity of [0, -1, 1.5, "2", NaN, Infinity]) {
    assert.throws(() => h.sales.createSalesBatch([line(h.product, quantity)]));
  }
  assert.throws(() => h.sales.createSalesBatch([]), /empty/);
  assert.throws(() => h.sales.createSalesBatch([line(h.product, 3, { total_price: 100 })]), /total is incorrect/);
  assert.throws(() => h.sales.createSalesBatch([line(h.product, 1, { unit_price: 90 })]), /price/);
  assert.throws(() => h.sales.createSalesBatch([line(h.product, 1, { total_price: -1 })]), /non-negative/);
  assert.equal(h.sales.getAllSales().length, 0);
  assert.equal(h.products.getProductById(h.product.id).stock, 5);
});

test("backend calculates authoritative totals and handles fractional DZD exactly", async t => {
  const h = await shop(t, 3, 0.1);
  const result = h.sales.createSalesBatch([{ product_id: h.product.id, quantity: 3 }]);
  assert.equal(result[0].total_price, 0.3);
  assert.equal(h.sales.getAllSales()[0].total_price, 0.3);
  assert.equal(h.products.getProductById(h.product.id).stock, 0);
});

test("durable checkout replay does not recheck depleted stock or duplicate a sale", async t => {
  const h = await shop(t, 1);
  const cart = [line(h.product)];
  const first = h.sales.createSalesBatch(cart, "durable-1");
  const replay = h.sales.createSalesBatch(cart, "durable-1");
  assert.equal(JSON.stringify(replay), JSON.stringify(first));
  assert.equal(h.sales.getAllSales().length, 1);
  assert.equal(h.products.getProductById(h.product.id).stock, 0);
  assert.throws(() => h.sales.createSalesBatch([line(h.product, 2)], "durable-1"), /different cart/);
});

test("ordinary product edits retain their active state", async t => {
  const h = await shop(t);
  h.products.updateProduct(h.product.id, { name: "Water", price: 120, type: "Product", stock: 5 });
  assert.equal(h.products.getProductById(h.product.id).is_active, 1);
});

test("archiving retains all financial and membership history and reserves the old barcode", async t => {
  const h = await shop(t);
  const subId = Number(h.subs.create(subscription()).lastInsertRowid);
  h.access.handleAccessRequest("GYM12345678", "CHECK_IN");
  h.sales.createSale(line(h.product));
  const before = h.subs.getStats().monthlyRevenue;
  h.members.delete("GYM12345678");
  h.members.delete("GYM12345678");
  assert.equal(h.members.findById("GYM12345678").is_archived, 1);
  assert.equal(h.members.findByBarcode("GYM12345678").id, "GYM12345678");
  assert.equal(h.members.findAll().some(member => member.id === "GYM12345678"), false);
  assert.equal(h.subs.findById(subId).status, "CANCELLED");
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM transactions").get().n, 1);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM access_logs").get().n, 1);
  assert.equal(h.subs.getStats().monthlyRevenue, before);
  assert.equal(h.sales.getAllSales()[0].first_name, "Test");
  assert.equal(h.sales.getAllSales()[0].member_id, "GYM12345678");
  assert.equal(h.access.handleAccessRequest("GYM12345678", "CHECK_IN").status, "DENIED");
  assert.throws(() => h.subs.renew("GYM12345678", subscription()), /archived/);
  assert.throws(() => h.subs.updateStatus(subId, "ACTIVE"), /archived/);
  assert.throws(() => h.saveMember({ member: { id: "GYM12345678", firstName: "Edit", lastName: "One", phone: "0" } }), /archived/);
});

test("duplicate scans neither deduct sessions nor add check-in logs, but later visits do", async t => {
  const h = await harness(t);
  const subId = Number(h.subs.create(subscription()).lastInsertRowid);
  h.access.handleAccessRequest("GYM12345678", "CHECK_IN");
  const duplicate = h.access.handleAccessRequest('GY?&é"\'(-è_', "CHECK_IN");
  assert.equal(duplicate.status, "GRANTED");
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.subscription.remainingSessions, 9);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM access_logs").get().n, 1);
  h.db.exec("UPDATE access_logs SET timestamp = datetime('now', '-4 seconds')");
  assert.equal(h.access.handleAccessRequest("GYM12345678", "CHECK_IN").subscription.remainingSessions, 8);
  h.access.handleAccessRequest("GYM12345678", "CHECK_OUT");
  assert.equal(h.access.handleAccessRequest("GYM12345678", "CHECK_IN").subscription.remainingSessions, 7);
  assert.equal(h.subs.findById(subId).remaining_sessions, 7);
});

test("renewal and other members bypass the duplicate window; cancelled access does not replay", async t => {
  const h = await harness(t);
  h.subs.create(subscription());
  h.access.handleAccessRequest("GYM12345678", "CHECK_IN");
  h.subs.create(subscription({ memberId: "GYM87654321" }));
  assert.equal(h.access.handleAccessRequest("GYM87654321", "CHECK_IN").subscription.remainingSessions, 9);
  const renewed = Number(h.subs.renew("GYM12345678", subscription()).lastInsertRowid);
  const scan = h.access.handleAccessRequest("GYM12345678", "CHECK_IN");
  assert.equal(scan.subscription.id, renewed);
  assert.equal(scan.subscription.remainingSessions, 9);
  assert.equal(scan.duplicate, undefined);
  h.subs.updateStatus(renewed, "CANCELLED");
  assert.equal(h.access.handleAccessRequest("GYM12345678", "CHECK_IN").status, "DENIED");
});

test("the last visit is protected against a rescan, then remains exhausted", async t => {
  const h = await harness(t);
  h.subs.create(subscription({ remainingSessions: 1 }));
  h.access.handleAccessRequest("GYM12345678", "CHECK_IN");
  const duplicate = h.access.handleAccessRequest("GYM12345678", "CHECK_IN");
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.subscription.remainingSessions, 0);
  assert.equal(duplicate.subscription.planName, "Ten visits");
  h.db.exec("UPDATE access_logs SET timestamp = datetime('now', '-4 seconds')");
  assert.equal(h.access.handleAccessRequest("GYM12345678", "CHECK_IN").status, "DENIED");
  const logs = (await h.get("electron/repositories/accessLogRepository.js")).accessLogRepository;
  assert.equal(logs.getCurrentlyInside().length, 1);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM access_logs WHERE status='GRANTED'").get().n, 1);
});

test("editing a member after plan rule changes keeps the purchased limits", async t => {
  const h = await harness(t);
  const plans = (await h.get("electron/repositories/planRepository.js")).planRepository;
  const id = Number(h.subs.create(subscription({ planId: 1, endDate: day(30), remainingSessions: null })).lastInsertRowid);
  plans.update(1, { name: "Monthly", type: "TIME_BASED", duration_days: 60, session_count: 12, price: 3000, is_active: 0 });
  h.saveMember({
    member: { ...h.members.findByIdWithSubscription("GYM12345678"), firstName: "Changed" },
    subscriptionId: id,
    subscription: subscription({ planId: 1, endDate: day(30), remainingSessions: null }),
  });
  assert.equal(h.members.findById("GYM12345678").first_name, "Changed");
  assert.equal(h.subs.findById(id).remaining_sessions, null);
  assert.equal(h.subs.findById(id).end_date, day(30));
  assert.equal(h.subs.findById(id).price_paid, 1500);
  assert.equal(h.access.handleAccessRequest("GYM12345678", "CHECK_IN").status, "GRANTED");
});

test("session-only purchases stay editable when their plan changes to time-only", async t => {
  const h = await harness(t);
  const plans = (await h.get("electron/repositories/planRepository.js")).planRepository;
  const id = Number(h.subs.create(subscription()).lastInsertRowid);
  plans.update(2, { name: "Now monthly", type: "TIME_BASED", duration_days: 30, session_count: null, price: 2000, is_active: 1 });
  h.subs.update(id, subscription({ remainingSessions: 8 }));
  assert.equal(h.subs.findById(id).end_date, null);
  assert.equal(h.subs.findById(id).remaining_sessions, 8);
  assert.throws(() => h.subs.update(id, subscription({ remainingSessions: null })), /requires a session count/);
  h.subs.update(id, subscription({ remainingSessions: 0 }));
  assert.equal(h.subs.findById(id).status, "EXPIRED");
  assert.throws(() => h.subs.updateStatus(id, "ACTIVE"), /Renew it first/);
  assert.throws(() => h.subs.renew("GYM12345678", subscription()), /requires an end date/);
});

test("operational upgrade backs up legacy data, adds archival fields and is repeatable", async t => {
  const h = await shop(t);
  h.subs.create(subscription());
  h.db.exec("DROP TABLE sales_checkouts; ALTER TABLE members DROP COLUMN is_archived; ALTER TABLE members DROP COLUMN archived_at;");
  const ops = await h.get("electron/db/operationalState.js");
  const folder = path.join(root, "test-results");
  fs.mkdirSync(folder, { recursive: true });
  const backupPath = path.join(folder, 'ops-upgrade-' + process.pid + '.db');
  t.after(() => { if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath); });
  assert.equal(ops.upgradeOperations(h.db, backupPath), true);
  const backup = new Database(backupPath, { readonly: true });
  try {
    assert.equal(backup.prepare("PRAGMA table_info(members)").all().some(column => column.name === "is_archived"), false);
    assert.equal(backup.prepare("SELECT COUNT(*) n FROM transactions").get().n, 1);
  } finally { backup.close(); }
  assert.equal(h.members.findById("GYM12345678").is_archived, 0);
  assert.equal(h.subs.getStats().monthlyRevenue, 1500);
  assert.equal(ops.upgradeOperations(h.db, backupPath), false);
  h.members.delete("GYM12345678");
  assert.equal(h.subs.getStats().monthlyRevenue, 1500);
});

test("a failed operational backup prevents schema changes", async t => {
  const h = await harness(t);
  h.db.exec("DROP TABLE sales_checkouts; ALTER TABLE members DROP COLUMN is_archived; ALTER TABLE members DROP COLUMN archived_at;");
  const ops = await h.get("electron/db/operationalState.js");
  assert.throws(() => ops.upgradeOperations(h.db, path.join(root, "test-results", "missing-folder", "backup.db")));
  assert.equal(h.db.prepare("PRAGMA table_info(members)").all().some(column => column.name === "is_archived"), false);
  assert.equal(ops.needsOperationalMigration(h.db), true);
});
