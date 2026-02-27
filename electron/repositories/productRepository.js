import db from "../db/client.js";

// Get all products
export const getAllProducts = () => {
  const stmt = db.prepare("SELECT * FROM products ORDER BY type, name");
  return stmt.all();
};

// Get a single product by ID
export const getProductById = (id) => {
  const stmt = db.prepare("SELECT * FROM products WHERE id = ?");
  return stmt.get(id);
};

// Create a new product
export const createProduct = (product) => {
  const { name, price, type, stock = 0, is_active = 1 } = product;
  const stmt = db.prepare(
    "INSERT INTO products (name, price, type, stock, is_active) VALUES (?, ?, ?, ?, ?)",
  );
  const info = stmt.run(name, price, type, stock, is_active);
  return { id: info.lastInsertRowid, ...product };
};

// Update an existing product
export const updateProduct = (id, product) => {
  const { name, price, type, stock, is_active } = product;
  const stmt = db.prepare(
    "UPDATE products SET name = ?, price = ?, type = ?, stock = ?, is_active = ? WHERE id = ?",
  );
  stmt.run(name, price, type, stock, is_active, id);
  return { id, ...product };
};

// Delete a product
export const deleteProduct = (id) => {
  const stmt = db.prepare("DELETE FROM products WHERE id = ?");
  stmt.run(id);
  return { success: true };
};
