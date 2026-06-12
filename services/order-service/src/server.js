import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import pg from 'pg';
import { z } from 'zod';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4103);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const jwtSecret = process.env.JWT_SECRET || 'replace-with-a-long-random-secret';
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:4102';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4104';

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

const orderSchema = z.object({
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.coerce.number().int().positive() })).min(1),
  shipping_address: z.record(z.string(), z.string())
});

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    req.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'paid',
      total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
      shipping_address JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL,
      seller_id UUID,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
      product_snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'order-service' });
});

app.post('/api/checkout', auth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    if (req.auth.role !== 'customer') return res.status(403).json({ message: 'Customer role required' });
    const body = orderSchema.parse(req.body);
    const productSnapshots = [];
    let total = 0;

    for (const item of body.items) {
      const response = await fetch(`${productServiceUrl}/api/products/${item.product_id}`);
      if (!response.ok) return res.status(400).json({ message: `Product unavailable: ${item.product_id}` });
      const { data: product } = await response.json();
      if (!product || product.inventory_count < item.quantity) return res.status(400).json({ message: `Insufficient inventory: ${item.product_id}` });
      total += Number(product.price) * item.quantity;
      productSnapshots.push({ item, product });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO orders (customer_id, total_amount, shipping_address)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.auth.sub, total, body.shipping_address]
    );

    for (const snapshot of productSnapshots) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, product_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rows[0].id, snapshot.product.id, snapshot.product.seller_id, snapshot.item.quantity, snapshot.product.price, snapshot.product]
      );
      await fetch(`${productServiceUrl}/api/products/${snapshot.product.id}/inventory`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: req.headers.authorization },
        body: JSON.stringify({ quantity: -snapshot.item.quantity })
      });
    }
    await client.query('COMMIT');

    fetch(`${notificationServiceUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: req.headers.authorization },
      body: JSON.stringify({ user_id: req.auth.sub, type: 'order_created', message: `Order ${rows[0].id} created` })
    }).catch(() => {});

    return res.status(201).json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

app.get('/api/orders', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
    [req.auth.sub]
  );
  res.json({ data: rows });
});

app.get('/api/orders/seller/me', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM order_items WHERE seller_id = $1 ORDER BY created_at DESC', [req.auth.sub]);
  res.json({ data: rows });
});

app.get('/api/seller/orders', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM order_items WHERE seller_id = $1 ORDER BY created_at DESC', [req.auth.sub]);
  res.json({ data: rows });
});

app.get('/api/seller/earnings', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(quantity * unit_price), 0)::numeric(12,2) AS gross_earnings,
            COUNT(DISTINCT order_id)::int AS order_count,
            COALESCE(SUM(quantity), 0)::int AS units_sold
     FROM order_items WHERE seller_id = $1`,
    [req.auth.sub]
  );
  res.json({ data: rows[0] });
});

app.get('/api/admin/dashboard', auth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin role required' });
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS orders,
            COALESCE(SUM(total_amount), 0)::numeric(12,2) AS revenue
     FROM orders WHERE status <> 'cancelled'`
  );
  return res.json({ data: { users: 0, pending_sellers: 0, pending_products: 0, ...rows[0] } });
});

app.get('/api/admin/analytics', auth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin role required' });
  const { rows } = await pool.query(
    `SELECT product_snapshot->>'category_name' AS category,
            COUNT(DISTINCT product_id)::int AS product_count,
            COALESCE(SUM(quantity * unit_price), 0)::numeric(12,2) AS sales
     FROM order_items
     GROUP BY product_snapshot->>'category_name'
     ORDER BY sales DESC`
  );
  return res.json({ data: rows });
});

app.use((error, _req, res, _next) => {
  const status = error instanceof z.ZodError ? 400 : 500;
  res.status(status).json({ message: status === 400 ? 'Validation failed' : error.message, details: error.flatten?.() });
});

await migrate();
app.listen(port, () => console.log(`Order Service listening on ${port}`));
