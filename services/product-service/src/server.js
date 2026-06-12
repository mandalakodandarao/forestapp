import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import pg from 'pg';
import { z } from 'zod';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4102);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const jwtSecret = process.env.JWT_SECRET || 'replace-with-a-long-random-secret';

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

const productSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(3),
  description: z.string().min(20),
  price: z.coerce.number().nonnegative(),
  inventory_count: z.coerce.number().int().nonnegative(),
  image_url: z.string().url().optional().nullable(),
  origin_region: z.string().optional().nullable()
});

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

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

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.auth?.role) ? next() : res.status(403).json({ message: 'Insufficient permissions' });
}

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(120) NOT NULL UNIQUE,
      slug VARCHAR(140) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      seller_id UUID NOT NULL,
      category_id UUID NOT NULL REFERENCES categories(id),
      name VARCHAR(180) NOT NULL,
      slug VARCHAR(220) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
      inventory_count INTEGER NOT NULL CHECK (inventory_count >= 0),
      image_url TEXT,
      status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'pending',
      origin_region VARCHAR(160),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO categories (name, slug, description)
    VALUES
      ('Forest Honey', 'forest-honey', 'Raw honey harvested by forest communities.'),
      ('Handicrafts', 'handicrafts', 'Handmade craft, textile, and home goods.'),
      ('Millets and Grains', 'millets-grains', 'Traditional grains from small farmers.'),
      ('Herbal Wellness', 'herbal-wellness', 'Forest herbs, oils, and wellness products.')
    ON CONFLICT (slug) DO NOTHING
  `);
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'product-service' });
});

app.get('/api/categories', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json({ data: rows });
});

app.get('/api/products', async (req, res) => {
  const search = req.query.search;
  const category = req.query.category;
  const params = [];
  const where = ["p.status = 'approved'"];
  if (search) {
    params.push(`%${search}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`c.slug = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug, p.seller_id::text AS seller_name
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(' AND ')}
     ORDER BY p.created_at DESC`,
    params
  );
  res.json({ data: rows });
});

app.get('/api/products/seller/me', auth, requireRole('seller'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC', [req.auth.sub]);
  res.json({ data: rows });
});

app.get('/api/products/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug, p.seller_id::text AS seller_name
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [req.params.id]
  );
  res.json({ data: rows[0] });
});

app.post('/api/products', auth, requireRole('seller'), async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const slug = `${slugify(body.name)}-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO products (seller_id, category_id, name, slug, description, price, inventory_count, image_url, origin_region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.auth.sub, body.category_id, body.name, slug, body.description, body.price, body.inventory_count, body.image_url, body.origin_region]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post('/api/seller/products', auth, requireRole('seller'), async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const slug = `${slugify(body.name)}-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO products (seller_id, category_id, name, slug, description, price, inventory_count, image_url, origin_region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.auth.sub, body.category_id, body.name, slug, body.description, body.price, body.inventory_count, body.image_url, body.origin_region]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/seller/products', auth, requireRole('seller'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC', [req.auth.sub]);
  res.json({ data: rows });
});

app.put('/api/seller/products/:id', auth, requireRole('seller'), async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE products
       SET category_id = $1, name = $2, description = $3, price = $4,
           inventory_count = $5, image_url = $6, origin_region = $7, status = 'pending'
       WHERE id = $8 AND seller_id = $9
       RETURNING *`,
      [body.category_id, body.name, body.description, body.price, body.inventory_count, body.image_url, body.origin_region, req.params.id, req.auth.sub]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/seller/products/:id', auth, requireRole('seller'), async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = $1 AND seller_id = $2', [req.params.id, req.auth.sub]);
  res.status(204).send();
});

app.get('/api/admin/products', auth, requireRole('admin'), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name, p.seller_id::text AS seller_name
     FROM products p JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`
  );
  res.json({ data: rows });
});

app.patch('/api/admin/products/:id/status', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = z.enum(['approved', 'rejected']).parse(req.body.status);
    const { rows } = await pool.query('UPDATE products SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/products/:id/status', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = z.enum(['approved', 'rejected']).parse(req.body.status);
    const { rows } = await pool.query('UPDATE products SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/products/:id/inventory', auth, async (req, res, next) => {
  try {
    const quantity = z.coerce.number().int().parse(req.body.quantity);
    const { rows } = await pool.query(
      'UPDATE products SET inventory_count = inventory_count + $1 WHERE id = $2 RETURNING *',
      [quantity, req.params.id]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error instanceof z.ZodError ? 400 : 500;
  res.status(status).json({ message: status === 400 ? 'Validation failed' : error.message, details: error.flatten?.() });
});

await migrate();
app.listen(port, () => console.log(`Product Service listening on ${port}`));
