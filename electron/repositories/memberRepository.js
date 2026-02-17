import db from "../db/client.js";

export const memberRepository = {
  findAll: () => {
    // Efficient "Latest" retrieval in SQLite:
    const stmt = db.prepare(`
        SELECT 
            m.id, m.first_name, m.last_name, m.phone, m.email, m.qr_code, m.photo_url, m.created_at,
            s.id as subscription_id,
            s.status as subscription_status,
            s.start_date as subscription_start_date,
            s.end_date as subscription_end_date,
            s.remaining_sessions,
            p.name as plan_name,
            p.type as plan_type
        FROM members m
        LEFT JOIN subscriptions s ON s.id = (
            SELECT id FROM subscriptions 
            WHERE member_id = m.id 
            ORDER BY created_at DESC 
            LIMIT 1
        )
        LEFT JOIN plans p ON s.plan_id = p.id
        ORDER BY m.created_at DESC
    `);

    return stmt.all().map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      qrCode: row.qr_code,
      photoUrl: row.photo_url,
      createdAt: row.created_at,
      subscription: row.subscription_id
        ? {
            id: row.subscription_id,
            status: row.subscription_status,
            startDate: row.subscription_start_date,
            endDate: row.subscription_end_date,
            remainingSessions: row.remaining_sessions,
            planName: row.plan_name,
            planType: row.plan_type,
          }
        : null,
    }));
  },

  findById: (id) => {
    const stmt = db.prepare("SELECT * FROM members WHERE id = ?");
    return stmt.get(id);
  },

  create: (member) => {
    const stmt = db.prepare(`
      INSERT INTO members (id, first_name, last_name, phone, email, qr_code, photo_url)
      VALUES (@id, @firstName, @lastName, @phone, @email, @qrCode, @photoUrl)
    `);
    return stmt.run(member);
  },

  update: (id, member) => {
    const stmt = db.prepare(`
      UPDATE members 
      SET first_name = @firstName, last_name = @lastName, phone = @phone, 
          email = @email, photo_url = @photoUrl, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    // Pass id specifically along with the member object
    return stmt.run({ ...member, id });
  },

  delete: (id) => {
    const deleteSubscriptions = db.prepare(
      "DELETE FROM subscriptions WHERE member_id = ?",
    );
    const deleteAccessLogs = db.prepare(
      "DELETE FROM access_logs WHERE member_id = ?",
    );
    const deleteTransactions = db.prepare(
      "DELETE FROM transactions WHERE member_id = ?",
    );
    const deleteMember = db.prepare("DELETE FROM members WHERE id = ?");

    const transaction = db.transaction(() => {
      deleteSubscriptions.run(id);
      deleteAccessLogs.run(id);
      deleteTransactions.run(id);
      deleteMember.run(id);
    });

    return transaction(id);
  },
};
