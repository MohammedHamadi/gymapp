import db from "../db/client.js";

export const accessLogRepository = {
  create: (log) => {
    const stmt = db.prepare(`
      INSERT INTO access_logs (member_id, type, status, denial_reason)
      VALUES (@memberId, @type, @status, @denialReason)
    `);
    return stmt.run(log);
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
      SELECT al.*, m.first_name, m.last_name, m.photo_url 
      FROM access_logs al
      JOIN members m ON al.member_id = m.id
      ORDER BY al.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },
};
