import db from "../db/client.js";
import { expireSubscriptions } from "../db/subscriptionState.js";
import { isDate, localDate } from "../../shared/subscriptionRules.js";

function normalize(subscription, { allowInactivePlan = false } = {}) {
  const memberId = subscription.memberId;
  if (!db.prepare("SELECT 1 FROM members WHERE id = ?").get(memberId)) {
    throw new Error("Member does not exist.");
  }
  const plan = db.prepare("SELECT * FROM plans WHERE id = ?").get(subscription.planId);
  if (!plan || (!allowInactivePlan && !plan.is_active)) {
    throw new Error("Select an active, existing plan.");
  }
  if (!isDate(subscription.startDate) || (subscription.endDate != null && !isDate(subscription.endDate))) {
    throw new Error("Enter valid subscription dates.");
  }
  if (subscription.endDate && subscription.endDate < subscription.startDate) {
    throw new Error("End date cannot be before start date.");
  }
  if (plan.duration_days && !subscription.endDate) {
    throw new Error("This plan requires an end date.");
  }
  const pricePaid = Number(subscription.pricePaid);
  if (subscription.pricePaid === "" || subscription.pricePaid == null || !Number.isFinite(pricePaid) || pricePaid < 0) {
    throw new Error("Price must be a non-negative number.");
  }
  let remainingSessions = subscription.remainingSessions;
  if (remainingSessions === "" || remainingSessions == null) remainingSessions = null;
  else remainingSessions = Number(remainingSessions);
  if (!plan.session_count && remainingSessions === 0) remainingSessions = null;
  if (remainingSessions !== null && (!Number.isSafeInteger(remainingSessions) || remainingSessions < 0)) {
    throw new Error("Sessions must be a non-negative whole number.");
  }
  if (plan.session_count && remainingSessions === null) {
    throw new Error("This plan requires a session count.");
  }
  if (!subscription.endDate && remainingSessions === null) {
    throw new Error("A subscription needs an expiry date or a session limit.");
  }
  let status = subscription.status || "ACTIVE";
  if (!["ACTIVE", "EXPIRED", "CANCELLED"].includes(status)) throw new Error("Invalid subscription status.");
  if (status === "ACTIVE" && ((subscription.endDate && subscription.endDate < localDate()) || remainingSessions === 0)) {
    status = "EXPIRED";
  }
  return {
    memberId, planId: plan.id, startDate: subscription.startDate,
    endDate: subscription.endDate || null, remainingSessions, status, pricePaid,
    autoRenew: subscription.autoRenew ? 1 : 0,
  };
}

function ensureSingleActive(memberId, exceptId = -1) {
  expireSubscriptions(db);
  const other = db.prepare("SELECT id FROM subscriptions WHERE member_id = ? AND status = 'ACTIVE' AND id != ?").get(memberId, exceptId);
  if (other) throw new Error("This member already has an active subscription. Use Renew to replace it.");
}

function insertSubscription(sub, paymentMethod) {
  if (sub.status === "ACTIVE") ensureSingleActive(sub.memberId);
  const info = db.prepare(`
    INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, remaining_sessions, status, price_paid, auto_renew)
    VALUES (@memberId, @planId, @startDate, @endDate, @remainingSessions, @status, @pricePaid, @autoRenew)
  `).run(sub);
  db.prepare(`
    INSERT INTO transactions (member_id, subscription_id, amount, type, payment_method)
    VALUES (?, ?, ?, 'SUBSCRIPTION', ?)
  `).run(sub.memberId, info.lastInsertRowid, sub.pricePaid, paymentMethod || "CASH");
  return info;
}

export const subscriptionRepository = {
  findAll: () => {
    expireSubscriptions(db);
    return db.prepare(`
      SELECT s.*, m.first_name, m.last_name, p.name AS plan_name
      FROM subscriptions s
      LEFT JOIN members m ON s.member_id = m.id
      LEFT JOIN plans p ON s.plan_id = p.id
      ORDER BY s.id DESC
    `).all();
  },

  findById: (id) => {
    expireSubscriptions(db);
    return db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(id);
  },

  findByMemberId: (memberId) => {
    expireSubscriptions(db);
    return db.prepare(`
      SELECT s.*, p.name AS plan_name FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id WHERE s.member_id = ? ORDER BY s.id DESC
    `).all(memberId);
  },

  findActiveByMemberId: (memberId) => {
    expireSubscriptions(db);
    return db.prepare(`
      SELECT s.*, p.name AS plan_name, p.type AS plan_type
      FROM subscriptions s JOIN plans p ON s.plan_id = p.id
      WHERE s.member_id = ? AND s.status = 'ACTIVE' ORDER BY s.id DESC
    `).all(memberId);
  },

  getStats: () => {
    expireSubscriptions(db);
    const counts = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'ACTIVE' AND date(start_date) <= @today THEN 1 END) AS activeCount,
        COUNT(CASE WHEN status = 'ACTIVE' AND date(start_date) <= @today
          AND date(end_date) BETWEEN @today AND date(@today, '+7 days') THEN 1 END) AS expiringCount,
        COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) AS expiredCount
      FROM subscriptions
    `).get({ today: localDate() });
    const { total } = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
      WHERE type = 'SUBSCRIPTION' AND strftime('%Y-%m', transaction_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
    `).get();
    return { ...counts, monthlyRevenue: total };
  },

  getExpiring: () => {
    expireSubscriptions(db);
    return db.prepare(`
      SELECT s.*, m.first_name, m.last_name, m.id AS member_display_id, p.name AS plan_name, p.price AS plan_price
      FROM subscriptions s LEFT JOIN members m ON s.member_id = m.id LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'ACTIVE' AND date(s.start_date) <= @today
        AND date(s.end_date) BETWEEN @today AND date(@today, '+7 days')
      ORDER BY s.end_date ASC
    `).all({ today: localDate() });
  },

  create: (subscription) => db.transaction(() => {
    const sub = normalize(subscription);
    return insertSubscription(sub, subscription.paymentMethod);
  })(),

  renew: (memberId, subscription) => db.transaction(() => {
    const sub = normalize({ ...subscription, memberId, status: "ACTIVE" });
    if (sub.status !== "ACTIVE") throw new Error("Renewal must have a valid end date and available sessions.");
    expireSubscriptions(db);
    // Renewal replaces the member's current subscription, even when changing plans.
    db.prepare("UPDATE subscriptions SET status = 'CANCELLED' WHERE member_id = ? AND status = 'ACTIVE'").run(memberId);
    return insertSubscription(sub, subscription.paymentMethod);
  })(),

  update: (id, subscription) => db.transaction(() => {
    const old = db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(id);
    if (!old) throw new Error("Subscription does not exist.");
    if (subscription.memberId !== old.member_id || Number(subscription.planId) !== old.plan_id) {
      throw new Error("A subscription's member and plan cannot be changed. Use Renew to switch plans.");
    }
    const sub = normalize(subscription, { allowInactivePlan: true });
    if (sub.status === "ACTIVE") ensureSingleActive(sub.memberId, id);
    const result = db.prepare(`
      UPDATE subscriptions SET start_date = @startDate, end_date = @endDate,
        remaining_sessions = @remainingSessions, status = @status, price_paid = @pricePaid, auto_renew = @autoRenew
      WHERE id = @id
    `).run({ ...sub, id });
    if (old.price_paid !== sub.pricePaid) {
      db.prepare("UPDATE transactions SET amount = ? WHERE subscription_id = ? AND type = 'SUBSCRIPTION'").run(sub.pricePaid, id);
    }
    return result;
  })(),

  updateStatus: (id, status) => {
    const old = subscriptionRepository.findById(id);
    if (!old) throw new Error("Subscription does not exist.");
    if (status === "ACTIVE" && ((old.end_date && old.end_date < localDate()) || old.remaining_sessions === 0)) {
      throw new Error("This subscription has expired or has no sessions. Renew it first.");
    }
    return subscriptionRepository.update(id, {
      memberId: old.member_id, planId: old.plan_id, startDate: old.start_date,
      endDate: old.end_date, remainingSessions: old.remaining_sessions,
      pricePaid: old.price_paid, autoRenew: old.auto_renew, status,
    });
  },

  decrementSession: (id) => db.transaction(() => {
    const result = db.prepare(`
      UPDATE subscriptions SET remaining_sessions = remaining_sessions - 1,
        status = CASE WHEN remaining_sessions = 1 THEN 'EXPIRED' ELSE status END
      WHERE id = ? AND status = 'ACTIVE' AND remaining_sessions > 0
    `).run(id);
    return result;
  })(),

  delete: (id) => {
    const linked = db.prepare(`
      SELECT 1 FROM transactions WHERE subscription_id = ?
      UNION ALL SELECT 1 FROM access_logs WHERE subscription_id = ? LIMIT 1
    `).get(id, id);
    if (linked) throw new Error("This subscription has payment or access history. Cancel it instead.");
    return db.prepare("DELETE FROM subscriptions WHERE id = ?").run(id);
  },
};
