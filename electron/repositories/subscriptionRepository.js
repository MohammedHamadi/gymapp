import db from "../db/client.js";

export const subscriptionRepository = {
  findAll: () => {
    const stmt = db.prepare(`
      SELECT s.*, m.first_name, m.last_name, p.name as plan_name 
      FROM subscriptions s
      LEFT JOIN members m ON s.member_id = m.id
      LEFT JOIN plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
    `);
    return stmt.all();
  },

  findById: (id) => {
    const stmt = db.prepare("SELECT * FROM subscriptions WHERE id = ?");
    return stmt.get(id);
  },

  findByMemberId: (memberId) => {
    const stmt = db.prepare(`
      SELECT s.*, p.name as plan_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.member_id = ?
      ORDER BY s.created_at DESC
    `);
    return stmt.all(memberId);
  },

  findActiveByMemberId: (memberId) => {
    const stmt = db.prepare(`
      SELECT s.*, p.name as plan_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.member_id = ? AND s.status = 'ACTIVE'
      ORDER BY s.end_date DESC
    `);
    return stmt.all(memberId);
  },

  getStats: () => {
    // Active: Marked active AND not physically expired
    const activeCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'ACTIVE' AND (end_date >= date('now') OR end_date IS NULL)",
      )
      .get().count;

    // Expiring: Active, not expired, and ending within 7 days
    const expiringCount = db
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM subscriptions 
        WHERE status = 'ACTIVE' 
        AND end_date >= date('now')
        AND end_date <= date('now', '+7 days') 
    `,
      )
      .get().count;

    // Expired: Explicitly expired OR Active but past end date
    const expiredCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'EXPIRED' OR (status = 'ACTIVE' AND end_date < date('now'))",
      )
      .get().count;

    // Revenue from Transactions this month (includes new subscriptions)
    const monthlyRevenue = db
      .prepare(
        `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `,
      )
      .get().total;

    return {
      activeCount,
      expiringCount,
      expiredCount,
      monthlyRevenue,
    };
  },

  getExpiring: () => {
    const stmt = db.prepare(`
        SELECT s.*, m.first_name, m.last_name, m.id as member_display_id, p.name as plan_name, p.price as plan_price
        FROM subscriptions s
        LEFT JOIN members m ON s.member_id = m.id
        LEFT JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'ACTIVE' 
        AND s.end_date <= date('now', '+7 days') 
        AND s.end_date >= date('now')
        ORDER BY s.end_date ASC
    `);
    return stmt.all();
  },

  create: (subscription) => {
    const insertSub = db.prepare(`
      INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, remaining_sessions, status, price_paid, auto_renew)
      VALUES (@memberId, @planId, @startDate, @endDate, @remainingSessions, @status, @pricePaid, @autoRenew)
    `);

    const insertTrans = db.prepare(`
      INSERT INTO transactions (member_id, subscription_id, amount, type, payment_method, transaction_date)
      VALUES (@memberId, @subscriptionId, @amount, 'SUBSCRIPTION', @paymentMethod, datetime('now'))
    `);

    const createTransaction = db.transaction((sub) => {
      const subData = {
        ...sub,
        autoRenew: sub.autoRenew ? 1 : 0,
      };
      const info = insertSub.run(subData);
      const subscriptionId = info.lastInsertRowid;

      insertTrans.run({
        memberId: sub.memberId,
        subscriptionId: subscriptionId,
        amount: sub.pricePaid,
        paymentMethod: sub.paymentMethod || "CASH",
      });

      return info;
    });

    return createTransaction(subscription);
  },

  renew: (memberId, subscription) => {
    // 1. Cancel active subscriptions for THIS plan
    const cancelOld = db.prepare(`
      UPDATE subscriptions 
      SET status = 'CANCELLED' 
      WHERE member_id = @memberId 
      AND plan_id = @planId 
      AND status = 'ACTIVE'
    `);

    // 2. Prepare Insert Statements
    const insertSub = db.prepare(`
      INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, remaining_sessions, status, price_paid, auto_renew)
      VALUES (@memberId, @planId, @startDate, @endDate, @remainingSessions, @status, @pricePaid, @autoRenew)
    `);

    const insertTrans = db.prepare(`
      INSERT INTO transactions (member_id, subscription_id, amount, type, payment_method, transaction_date)
      VALUES (@memberId, @subscriptionId, @amount, 'SUBSCRIPTION', @paymentMethod, datetime('now'))
    `);

    const renewTransaction = db.transaction((sub) => {
      // Cancel old
      cancelOld.run({
        memberId: memberId,
        planId: sub.planId,
      });

      // Create new
      const subData = {
        ...sub,
        memberId: memberId,
        autoRenew: sub.autoRenew ? 1 : 0,
      };
      const info = insertSub.run(subData);
      const subscriptionId = info.lastInsertRowid;

      insertTrans.run({
        memberId: memberId,
        subscriptionId: subscriptionId,
        amount: sub.pricePaid,
        paymentMethod: sub.paymentMethod || "CASH",
      });

      return info;
    });

    return renewTransaction(subscription);
  },

  update: (id, subscription) => {
    const stmt = db.prepare(`
      UPDATE subscriptions 
      SET member_id = @memberId, plan_id = @planId, start_date = @startDate, 
          end_date = @endDate, remaining_sessions = @remainingSessions, 
          status = @status, price_paid = @pricePaid, auto_renew = @autoRenew
      WHERE id = @id
    `);
    const data = {
      ...subscription,
      autoRenew: subscription.autoRenew ? 1 : 0,
      id,
    };
    return stmt.run(data);
  },

  updateStatus: (id, status) => {
    const stmt = db.prepare("UPDATE subscriptions SET status = ? WHERE id = ?");
    return stmt.run(status, id);
  },

  decrementSession: (id) => {
    const stmt = db.prepare(`
      UPDATE subscriptions 
      SET remaining_sessions = remaining_sessions - 1 
      WHERE id = ? AND remaining_sessions > 0
    `);
    return stmt.run(id);
  },

  delete: (id) => {
    const stmt = db.prepare("DELETE FROM subscriptions WHERE id = ?");
    return stmt.run(id);
  },
};
