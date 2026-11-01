import db from "../db/client.js";
import { moneyCents } from "../../shared/money.js";

function normalizeCart(sales) {
  if (!Array.isArray(sales) || sales.length === 0) throw new Error("The cart is empty.");
  return sales.map(sale => {
    const productId = Number(sale.product_id);
    const quantity = sale.quantity ?? 1;
    if (!Number.isSafeInteger(productId) || productId <= 0
      || !Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error("Choose a valid product and a positive whole-number quantity.");
    }
    if (sale.member_id != null && typeof sale.member_id !== "string") {
      throw new Error("Invalid member.");
    }
    const paymentMethod = String(sale.payment_method || "CASH").toUpperCase();
    if (!["CASH", "CARD", "TRANSFER"].includes(paymentMethod)) throw new Error("Invalid payment method.");
    return {
      product_id: productId, member_id: sale.member_id || null, quantity,
      payment_method: paymentMethod,
      unit_cents: sale.unit_price === undefined ? null : moneyCents(sale.unit_price, "Unit price"),
      total_cents: sale.total_price === undefined ? null : moneyCents(sale.total_price, "Line total"),
    };
  });
}

export const createSalesBatch = (sales, requestId = null) => {
  const cart = normalizeCart(sales);
  if (requestId !== null && (typeof requestId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(requestId))) {
    throw new Error("Invalid checkout request ID.");
  }
  const requestJson = JSON.stringify(cart);
  return db.transaction(() => {
    if (requestId) {
      const previous = db.prepare("SELECT * FROM sales_checkouts WHERE id = ?").get(requestId);
      if (previous) {
        if (previous.request_json !== requestJson) throw new Error("This checkout ID belongs to a different cart.");
        return JSON.parse(previous.result_json);
      }
    }
    const results = cart.map(sale => {
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(sale.product_id);
      if (!product || product.is_active === 0) throw new Error("A selected product is no longer available.");
      if (sale.member_id) {
        const member = db.prepare("SELECT is_archived FROM members WHERE id = ?").get(sale.member_id);
        if (!member || member.is_archived) throw new Error("The selected member is no longer available.");
      }
      const unitCents = moneyCents(product.price, "Product price");
      const lineCents = unitCents * sale.quantity;
      if (!Number.isSafeInteger(lineCents)) throw new Error("The line total is too large.");
      if ((sale.unit_cents !== null && sale.unit_cents !== unitCents)
        || (sale.total_cents !== null && sale.total_cents !== lineCents)) {
        throw new Error(`The price of ${product.name} changed or its total is incorrect. Refresh the cart.`);
      }
      if (!Number.isSafeInteger(product.stock) || product.stock < sale.quantity) {
        throw new Error(`Not enough stock for ${product.name} (${product.stock} available).`);
      }
      const stock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?").run(sale.quantity, product.id, sale.quantity);
      if (!stock.changes) throw new Error(`Not enough stock for ${product.name}.`);
      const totalPrice = lineCents / 100;
      const info = db.prepare(`
        INSERT INTO sales_history (product_id, member_id, quantity, total_price, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `).run(product.id, sale.member_id, sale.quantity, totalPrice, sale.payment_method);
      return {
        id: Number(info.lastInsertRowid), product_id: product.id, member_id: sale.member_id,
        quantity: sale.quantity, total_price: totalPrice, payment_method: sale.payment_method,
        product_name: product.name, unit_price: unitCents / 100,
      };
    });
    if (requestId) {
      db.prepare("INSERT INTO sales_checkouts (id, request_json, result_json) VALUES (?, ?, ?)").run(requestId, requestJson, JSON.stringify(results));
    }
    return results;
  }).immediate();
};

export const createSale = (sale, requestId = null) => createSalesBatch([sale], requestId)[0];

export const getAllSales = () => db.prepare(`
  SELECT sh.*, p.name AS product_name, p.type AS product_type, m.first_name, m.last_name
  FROM sales_history sh JOIN products p ON sh.product_id = p.id
  LEFT JOIN members m ON sh.member_id = m.id ORDER BY sh.id DESC
`).all();

export const getRecentSales = (limit = 10) => db.prepare(`
  SELECT sh.*, p.name AS product_name, p.type AS product_type, m.first_name, m.last_name
  FROM sales_history sh JOIN products p ON sh.product_id = p.id
  LEFT JOIN members m ON sh.member_id = m.id ORDER BY sh.id DESC LIMIT ?
`).all(limit);
