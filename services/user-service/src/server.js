import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import pg from 'pg';
import { z } from 'zod';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4101);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const jwtSecret = process.env.JWT_SECRET || 'replace-with-a-long-random-secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['customer', 'seller']).default('customer')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function tokenFor(user) {
  return jwt.sign({ role: user.role }, jwtSecret, { subject: user.id, expiresIn: jwtExpiresIn });
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

async function migrate() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(160) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'seller', 'admin')) DEFAULT 'customer',
      seller_status VARCHAR(20) NOT NULL CHECK (seller_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'user-service' });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const sellerStatus = body.role === 'seller' ? 'pending' : 'none';
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, seller_status)
       VALUES ($1, LOWER($2), $3, $4, $5)
       RETURNING id, name, email, role, seller_status, is_active, created_at`,
      [body.name, body.email, passwordHash, body.role, sellerStatus]
    );
    res.status(201).json({ user: rows[0], token: tokenFor(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const { rows } = await pool.query('SELECT * FROM users WHERE email = LOWER($1)', [body.email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      seller_status: user.seller_status,
      is_active: user.is_active,
      created_at: user.created_at
    };
    return res.json({ user: safeUser, token: tokenFor(user) });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/users/me', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, seller_status, is_active, created_at FROM users WHERE id = $1',
    [req.auth.sub]
  );
  res.json({ user: rows[0] });
});

app.get('/api/admin/users', auth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin role required' });
  const { rows } = await pool.query('SELECT id, name, email, role, seller_status, is_active, created_at FROM users ORDER BY created_at DESC');
  return res.json({ data: rows });
});

app.patch('/api/users/:id/seller-status', auth, async (req, res, next) => {
  try {
    if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin role required' });
    const status = z.enum(['approved', 'rejected']).parse(req.body.status);
    const { rows } = await pool.query(
      `UPDATE users SET seller_status = $1 WHERE id = $2 AND role = 'seller'
       RETURNING id, name, email, role, seller_status`,
      [status, req.params.id]
    );
    return res.json({ data: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/sellers/:id/status', auth, async (req, res, next) => {
  try {
    if (req.auth.role !== 'admin') return res.status(403).json({ message: 'Admin role required' });
    const status = z.enum(['approved', 'rejected']).parse(req.body.status);
    const { rows } = await pool.query(
      `UPDATE users SET seller_status = $1 WHERE id = $2 AND role = 'seller'
       RETURNING id, name, email, role, seller_status`,
      [status, req.params.id]
    );
    return res.json({ data: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error instanceof z.ZodError ? 400 : error.code === '23505' ? 409 : 500;
  res.status(status).json({ message: status === 400 ? 'Validation failed' : error.message, details: error.flatten?.() });
});

await migrate();
app.listen(port, () => console.log(`User Service listening on ${port}`));
