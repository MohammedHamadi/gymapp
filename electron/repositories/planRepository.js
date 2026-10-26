import db from "../db/client.js";

export const planRepository = {
  findAll: () => {
    const stmt = db.prepare("SELECT * FROM plans ORDER BY name ASC");
    return stmt.all();
  },

  findById: (id) => {
    const stmt = db.prepare("SELECT * FROM plans WHERE id = ?");
    return stmt.get(id);
  },

  create: (plan) => {
    const stmt = db.prepare(`
      INSERT INTO plans (name, type, duration_days, session_count, price, is_active)
      VALUES (@name, @type, @durationDays, @sessionCount, @price, @isActive)
    `);

    // Map frontend snake_case files to backend camelCase parameters
    const data = {
      name: plan.name,
      type: plan.type,
      durationDays: plan.duration_days ?? plan.durationDays ?? null,
      sessionCount: plan.session_count ?? plan.sessionCount ?? null,
      price: plan.price,
      isActive:
        plan.is_active !== undefined ? plan.is_active : plan.isActive ? 1 : 0,
    };
    return stmt.run(data);
  },

  update: (id, plan) => {
    const stmt = db.prepare(`
      UPDATE plans 
      SET name = @name, type = @type, duration_days = @durationDays, 
          session_count = @sessionCount, price = @price, is_active = @isActive
      WHERE id = @id
    `);

    const data = {
      id,
      name: plan.name,
      type: plan.type,
      durationDays: plan.duration_days ?? plan.durationDays ?? null,
      sessionCount: plan.session_count ?? plan.sessionCount ?? null,
      price: plan.price,
      isActive:
        plan.is_active !== undefined ? plan.is_active : plan.isActive ? 1 : 0,
    };
    return stmt.run(data);
  },

  delete: (id) => {
    if (db.prepare("SELECT 1 FROM subscriptions WHERE plan_id = ? LIMIT 1").get(id)) {
      throw new Error("This plan has subscription history. Deactivate it instead of deleting it.");
    }
    const stmt = db.prepare("DELETE FROM plans WHERE id = ?");
    return stmt.run(id);
  },
};
