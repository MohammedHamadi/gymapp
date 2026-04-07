import db from "../db/client.js";

// Get all equipment
export const getAllEquipment = () => {
  const stmt = db.prepare("SELECT * FROM equipment ORDER BY category, name");
  return stmt.all();
};

// Get a single equipment item by ID
export const getEquipmentById = (id) => {
  const stmt = db.prepare("SELECT * FROM equipment WHERE id = ?");
  return stmt.get(id);
};

// Create a new equipment item
export const createEquipment = (equipment) => {
  const {
    name,
    category,
    status = "AVAILABLE",
    condition = "NEW",
    quantity = 1,
    purchase_date = null,
    notes = null,
    image_path = null,
  } = equipment;
  const stmt = db.prepare(
    "INSERT INTO equipment (name, category, status, condition, quantity, purchase_date, notes, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const info = stmt.run(name, category, status, condition, quantity, purchase_date, notes, image_path);
  return { id: info.lastInsertRowid, ...equipment };
};

// Update an existing equipment item
export const updateEquipment = (id, equipment) => {
  const {
    name,
    category,
    status,
    condition,
    quantity,
    purchase_date,
    notes,
    image_path,
  } = equipment;
  const stmt = db.prepare(
    "UPDATE equipment SET name = ?, category = ?, status = ?, condition = ?, quantity = ?, purchase_date = ?, notes = ?, image_path = ? WHERE id = ?",
  );
  stmt.run(name, category, status, condition, quantity, purchase_date, notes, image_path, id);
  return { id, ...equipment };
};

// Delete an equipment item
export const deleteEquipment = (id) => {
  const stmt = db.prepare("DELETE FROM equipment WHERE id = ?");
  stmt.run(id);
  return { success: true };
};
