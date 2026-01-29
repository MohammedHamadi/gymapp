import db from "../db/client.js";

export const subscriptionRepository = {
  findAll: () => {
    const stmt = db.prepare(`
      SELECT s.*, m.first_name, m.last_name, p.name as plan_name 
      FROM subscriptions s
      JOIN members m ON s.member_id = m.id
      JOIN plans p ON s.plan_id = p.id
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

  create: (subscription) => {
    const stmt = db.prepare(`
      INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, remaining_sessions, status, price_paid, auto_renew)
      VALUES (@memberId, @planId, @startDate, @endDate, @remainingSessions, @status, @pricePaid, @autoRenew)
    `);
    const data = {
      ...subscription,
      autoRenew: subscription.autoRenew ? 1 : 0,
    };
    return stmt.run(data);
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
