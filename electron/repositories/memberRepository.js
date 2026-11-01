import db from "../db/client.js";
import { expireSubscriptions } from "../db/subscriptionState.js";

export const memberRepository = {
  findAll: () => {
    expireSubscriptions(db);
    // Efficient "Latest" retrieval in SQLite:
    const stmt = db.prepare(`
        SELECT 
            m.id, m.first_name, m.last_name, m.phone, m.email, m.qr_code, m.photo_url, m.photo, m.created_at, m.is_archived,
            s.id as subscription_id,
            s.plan_id, s.price_paid, s.auto_renew,
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
            ORDER BY (status = 'ACTIVE') DESC, id DESC
            LIMIT 1
        )
        LEFT JOIN plans p ON s.plan_id = p.id
        WHERE m.is_archived = 0
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
      photo: row.photo,
      createdAt: row.created_at,
      isArchived: !!row.is_archived,
      subscription: row.subscription_id
        ? {
            id: row.subscription_id,
            planId: row.plan_id,
            pricePaid: row.price_paid,
            autoRenew: row.auto_renew,
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

  findByBarcode: (barcode) => {
    return db.prepare("SELECT * FROM members WHERE id = @barcode OR qr_code = @barcode ORDER BY (id = @barcode) DESC LIMIT 1").get({ barcode });
  },

  findByIdWithSubscription: (id) => {
    expireSubscriptions(db);
    const stmt = db.prepare(`
        SELECT 
            m.id, m.first_name, m.last_name, m.phone, m.email, m.qr_code, m.photo_url, m.photo, m.created_at, m.is_archived,
            s.id as subscription_id,
            s.plan_id, s.price_paid, s.auto_renew,
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
            ORDER BY (status = 'ACTIVE') DESC, id DESC
            LIMIT 1
        )
        LEFT JOIN plans p ON s.plan_id = p.id
        WHERE m.id = ?
    `);

    const row = stmt.get(id);
    if (!row) return null;

    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      qrCode: row.qr_code,
      photoUrl: row.photo_url,
      photo: row.photo,
      createdAt: row.created_at,
      isArchived: !!row.is_archived,
      subscription: row.subscription_id
        ? {
            id: row.subscription_id,
            planId: row.plan_id,
            pricePaid: row.price_paid,
            autoRenew: row.auto_renew,
            status: row.subscription_status,
            startDate: row.subscription_start_date,
            endDate: row.subscription_end_date,
            remainingSessions: row.remaining_sessions,
            planName: row.plan_name,
            planType: row.plan_type,
          }
        : null,
    };
  },

  create: (member) => {
    const stmt = db.prepare(`
       INSERT INTO members (id, first_name, last_name, phone, email, qr_code, photo_url, photo)
      VALUES (@id, @firstName, @lastName, @phone, @email, @qrCode, @photoUrl, @photo)
    `);
    return stmt.run(member);
  },

  update: (id, member) => {
    const stmt = db.prepare(`
       UPDATE members 
      SET first_name = @firstName, last_name = @lastName, phone = @phone, 
          email = @email, photo_url = @photoUrl, photo = @photo, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id AND is_archived = 0
    `);
    // Pass id specifically along with the member object
    return stmt.run({ ...member, id });
  },

  // Preserve the public IPC method while making removal non-destructive.
  delete: (id) => db.transaction(() => {
    db.prepare("UPDATE subscriptions SET status = 'CANCELLED' WHERE member_id = ? AND status = 'ACTIVE'").run(id);
    return db.prepare(`
      UPDATE members SET is_archived = 1, archived_at = COALESCE(archived_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  })(),
};
