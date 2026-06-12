import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const upsertReview = asyncHandler(async (req, res) => {
  const { rows: purchasedRows } = await query(
    `SELECT 1
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.customer_id = $1 AND oi.product_id = $2 AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
     LIMIT 1`,
    [req.user.id, req.params.productId]
  );
  if (!purchasedRows[0]) throw new ApiError(403, 'Only customers who purchased this product can review it');

  const { rows } = await query(
    `INSERT INTO reviews (product_id, customer_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, customer_id)
     DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
     RETURNING *`,
    [req.params.productId, req.user.id, req.body.rating, req.body.comment]
  );
  res.status(201).json({ data: rows[0] });
});

