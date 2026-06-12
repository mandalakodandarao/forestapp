import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'seller' AND seller_status = 'pending') AS pending_sellers,
      (SELECT COUNT(*)::int FROM products WHERE status = 'pending') AS pending_products,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COALESCE(SUM(total_amount), 0)::numeric(12,2) FROM orders WHERE status <> 'cancelled') AS revenue`
  );
  res.json({ data: rows[0] });
});

export const manageUsers = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, role, seller_status, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ data: rows });
});

export const manageProducts = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name, u.name AS seller_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     ORDER BY p.created_at DESC`
  );
  res.json({ data: rows });
});

export const approveSeller = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE users
     SET seller_status = $1
     WHERE id = $2 AND role = 'seller'
     RETURNING id, name, email, role, seller_status`,
    [req.body.status, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Seller not found');
  res.json({ data: rows[0] });
});

export const approveProduct = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE products SET status = $1 WHERE id = $2 RETURNING *`,
    [req.body.status, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json({ data: rows[0] });
});

export const analytics = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT c.name AS category, COUNT(p.id)::int AS product_count,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric(12,2) AS sales
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     LEFT JOIN order_items oi ON oi.product_id = p.id
     GROUP BY c.id
     ORDER BY sales DESC`
  );
  res.json({ data: rows });
});
