import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import pg from 'pg';
import { z } from 'zod';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4104);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const jwtSecret = process.env.JWT_SECRET || 'replace-with-a-long-random-secret';

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

const notificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string().min(2),
  message: z.string().min(2),
  channel: z.enum(['in_app', 'email', 'sms']).default('in_app')
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
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      type VARCHAR(80) NOT NULL,
      channel VARCHAR(30) NOT NULL DEFAULT 'in_app',
      message TEXT NOT NULL,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'notification-service' });
});

app.post('/api/notifications', auth, async (req, res, next) => {
  try {
    const body = notificationSchema.parse(req.body);
    if (req.auth.role !== 'admin' && req.auth.sub !== body.user_id) {
      return res.status(403).json({ message: 'Cannot create notifications for another user' });
    }
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, channel, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [body.user_id, body.type, body.channel, body.message]
    );
    return res.status(201).json({ data: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/notifications', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [req.auth.sub]
  );
  res.json({ data: rows });
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.auth.sub]
  );
  res.json({ data: rows[0] });
});

app.use((error, _req, res, _next) => {
  const status = error instanceof z.ZodError ? 400 : 500;
  res.status(status).json({ message: status === 400 ? 'Validation failed' : error.message, details: error.flatten?.() });
});

await migrate();
app.listen(port, () => console.log(`Notification Service listening on ${port}`));

