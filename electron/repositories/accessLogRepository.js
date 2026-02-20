import db from "../db/client.js";

export const accessLogRepository = {
  create: (log) => {
    const {
      memberId,
      type,
      status,
      denialReason = null,
      subscriptionId = null,
    } = log;
    const stmt = db.prepare(`
      INSERT INTO access_logs (member_id, subscription_id, type, status, denial_reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(memberId, subscriptionId, type, status, denialReason);
  },

  findByMemberId: (memberId) => {
    const stmt = db.prepare(`
      SELECT * FROM access_logs 
      WHERE member_id = ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(memberId);
  },

  getRecentLogs: (limit = 50) => {
    const stmt = db.prepare(`
      SELECT al.*, m.first_name, m.last_name, m.photo_url, p.name as plan_name
      FROM access_logs al
      JOIN members m ON al.member_id = m.id
      LEFT JOIN subscriptions s ON al.subscription_id = s.id
      LEFT JOIN plans p ON s.plan_id = p.id
      ORDER BY al.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  getCurrentlyInside: () => {
    const stmt = db.prepare(`
      SELECT m.id, m.first_name, m.last_name, m.photo_url, al.timestamp as check_in_time
      FROM members m
      JOIN access_logs al ON m.id = al.member_id
      WHERE al.id = (
          SELECT MAX(id) FROM access_logs WHERE member_id = m.id
      )
      AND al.type = 'CHECK_IN'
      AND date(al.timestamp) = date('now')
    `);
    return stmt.all();
  },

  getTodayStats: () => {
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(CASE WHEN type = 'CHECK_IN' AND status = 'GRANTED' THEN 1 END) as total_check_ins,
        COUNT(CASE WHEN status = 'DENIED' THEN 1 END) as total_denied
      FROM access_logs
      WHERE date(timestamp) = date('now')
    `,
      )
      .get();

    return {
      totalCheckIns: stats.total_check_ins,
      totalDenied: stats.total_denied,
    };
  },
};
