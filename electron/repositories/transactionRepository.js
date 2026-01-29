import db from "../db/client.js";

export const transactionRepository = {
  create: (transaction) => {
    const stmt = db.prepare(`
      INSERT INTO transactions (member_id, subscription_id, amount, type, payment_method)
      VALUES (@memberId, @subscriptionId, @amount, @type, @paymentMethod)
    `);
    return stmt.run(transaction);
  },

  findByMemberId: (memberId) => {
    const stmt = db.prepare(`
      SELECT * FROM transactions 
      WHERE member_id = ? 
      ORDER BY transaction_date DESC
    `);
    return stmt.all(memberId);
  },

  getDailyTotal: (date) => {
    // Expected date format: YYYY-MM-DD
    const stmt = db.prepare(`
      SELECT SUM(amount) as total, COUNT(*) as count
      FROM transactions 
      WHERE date(transaction_date) = date(?)
    `);
    return stmt.get(date);
  },

  getAll: () => {
    const stmt = db.prepare(`
        SELECT t.*, m.first_name, m.last_name 
        FROM transactions t
        JOIN members m ON t.member_id = m.id
        ORDER BY t.transaction_date DESC
    `);
    return stmt.all();
  },
};
