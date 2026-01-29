import db from "../db/client.js";

export const memberRepository = {
  findAll: () => {
    const stmt = db.prepare("SELECT * FROM members ORDER BY created_at DESC");
    return stmt.all();
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
    const stmt = db.prepare("DELETE FROM members WHERE id = ?");
    return stmt.run(id);
  },
};
