import db from "../db/client.js";

// Record a new sale
export const createSale = (sale) => {
  const {
    product_id,
    member_id,
    quantity = 1,
    total_price,
    payment_method,
  } = sale;
  const stmt = db.prepare(
    "INSERT INTO sales_history (product_id, member_id, quantity, total_price, payment_method) VALUES (?, ?, ?, ?, ?)",
  );
  const info = stmt.run(
    product_id,
    member_id,
    quantity,
    total_price,
    payment_method,
  );
  return { id: info.lastInsertRowid, ...sale };
};

// Record multiple sales in a transaction
export const createSalesBatch = (sales) => {
  const stmt = db.prepare(
    "INSERT INTO sales_history (product_id, member_id, quantity, total_price, payment_method) VALUES (?, ?, ?, ?, ?)",
  );

  const insertMany = db.transaction((salesToInsert) => {
    const results = [];
    for (const sale of salesToInsert) {
      const {
        product_id,
        member_id,
        quantity = 1,
        total_price,
        payment_method,
      } = sale;
      const info = stmt.run(
        product_id,
        member_id,
        quantity,
        total_price,
        payment_method,
      );
      results.push({ id: info.lastInsertRowid, ...sale });
    }
    return results;
  });

  return insertMany(sales);
};

// Get all sales (with product and member details)
export const getAllSales = () => {
  const stmt = db.prepare(`
    SELECT sh.*, 
           p.name as product_name, p.type as product_type,
           m.first_name, m.last_name
    FROM sales_history sh
    JOIN products p ON sh.product_id = p.id
    LEFT JOIN members m ON sh.member_id = m.id
    ORDER BY sh.sale_date DESC
  `);
  return stmt.all();
};

// Get recent sales
export const getRecentSales = (limit = 10) => {
  const stmt = db.prepare(`
    SELECT sh.*, 
           p.name as product_name, p.type as product_type,
           m.first_name, m.last_name
    FROM sales_history sh
    JOIN products p ON sh.product_id = p.id
    LEFT JOIN members m ON sh.member_id = m.id
    ORDER BY sh.sale_date DESC
    LIMIT ?
  `);
  return stmt.all(limit);
};
