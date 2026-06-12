import { withTransaction, query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const checkout = asyncHandler(async (req, res) => {
  const order = await withTransaction(async (client) => {
    const ids = req.body.items.map((item) => item.product_id);
    const { rows: products } = await client.query(
      `SELECT id, seller_id, price, inventory_count
       FROM products
       WHERE id = ANY($1::uuid[]) AND status = 'approved'
       FOR UPDATE`,
      [ids]
    );

    const productMap = new Map(products.map((product) => [product.id, product]));
    let total = 0;

    for (const item of req.body.items) {
      const product = productMap.get(item.product_id);
      if (!product) throw new ApiError(400, `Product unavailable: ${item.product_id}`);
      if (product.inventory_count < item.quantity) throw new ApiError(400, `Insufficient inventory: ${item.product_id}`);
      total += Number(product.price) * item.quantity;
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (customer_id, status, total_amount, shipping_address)
       VALUES ($1, 'paid', $2, $3)
       RETURNING *`,
      [req.user.id, total, req.body.shipping_address]
    );

    for (const item of req.body.items) {
      const product = productMap.get(item.product_id);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderRows[0].id, product.id, product.seller_id, item.quantity, product.price]
      );
      await client.query(
        'UPDATE products SET inventory_count = inventory_count - $1 WHERE id = $2',
        [item.quantity, product.id]
      );
    }

    return orderRows[0];
  });

  res.status(201).json({ data: order });
});

export const orderHistory = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT o.*,
      COALESCE(json_agg(json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', p.name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price
      )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.customer_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ data: rows });
});

