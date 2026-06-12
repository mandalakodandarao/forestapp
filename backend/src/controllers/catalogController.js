import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT * FROM categories ORDER BY name');
  res.json({ data: rows });
});

export const listProducts = asyncHandler(async (req, res) => {
  const { search, category, page, limit } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ["p.status = 'approved'"];

  if (search) {
    params.push(search);
    conditions.push(`to_tsvector('english', p.name || ' ' || p.description) @@ plainto_tsquery('english', $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug, u.name AS seller_name,
            COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id, c.id, u.id
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ data: rows, pagination: { page, limit } });
});

export const getProduct = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug, u.name AS seller_name,
            COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE p.id = $1 AND p.status = 'approved'
     GROUP BY p.id, c.id, u.id`,
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json({ data: rows[0] });
});

export const listProductReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, u.name AS customer_name
     FROM reviews r
     JOIN users u ON u.id = r.customer_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  res.json({ data: rows });
});

