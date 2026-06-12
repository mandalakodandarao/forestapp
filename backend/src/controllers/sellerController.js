import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

export const createProduct = asyncHandler(async (req, res) => {
  const slug = `${slugify(req.body.name)}-${Date.now()}`;
  const { rows } = await query(
    `INSERT INTO products
      (seller_id, category_id, name, slug, description, price, inventory_count, image_url, origin_region, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
     RETURNING *`,
    [
      req.user.id,
      req.body.category_id,
      req.body.name,
      slug,
      req.body.description,
      req.body.price,
      req.body.inventory_count,
      req.body.image_url,
      req.body.origin_region
    ]
  );
  res.status(201).json({ data: rows[0] });
});

export const listSellerProducts = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.seller_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json({ data: rows });
});

export const updateSellerProduct = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE products
     SET category_id = $1, name = $2, description = $3, price = $4,
         inventory_count = $5, image_url = $6, origin_region = $7,
         status = CASE WHEN status = 'approved' THEN 'pending' ELSE status END
     WHERE id = $8 AND seller_id = $9
     RETURNING *`,
    [
      req.body.category_id,
      req.body.name,
      req.body.description,
      req.body.price,
      req.body.inventory_count,
      req.body.image_url,
      req.body.origin_region,
      req.params.id,
      req.user.id
    ]
  );
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json({ data: rows[0] });
});

export const deleteSellerProduct = asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1 AND seller_id = $2', [req.params.id, req.user.id]);
  if (!rowCount) throw new ApiError(404, 'Product not found');
  res.status(204).send();
});

export const sellerOrders = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT oi.*, o.status AS order_status, o.created_at AS order_created_at,
            p.name AS product_name, u.name AS customer_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     JOIN users u ON u.id = o.customer_id
     WHERE oi.seller_id = $1
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ data: rows });
});

export const sellerEarnings = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric(12,2) AS gross_earnings,
       COUNT(DISTINCT oi.order_id)::int AS order_count,
       SUM(oi.quantity)::int AS units_sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = $1 AND o.status <> 'cancelled'`,
    [req.user.id]
  );
  res.json({ data: rows[0] });
});

