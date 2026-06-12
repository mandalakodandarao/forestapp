import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const publicUserFields = 'id, name, email, role, seller_status, is_active, created_at';

export function signToken(user) {
  return jwt.sign(
    { role: user.role },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function registerUser({ name, email, password, role = 'customer' }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const sellerStatus = role === 'seller' ? 'pending' : 'none';

  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, seller_status)
       VALUES ($1, LOWER($2), $3, $4, $5)
       RETURNING ${publicUserFields}`,
      [name, email, passwordHash, role, sellerStatus]
    );
    const user = rows[0];
    return { user, token: signToken(user) };
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'Email is already registered');
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const { rows } = await query('SELECT * FROM users WHERE email = LOWER($1)', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.is_active) {
    throw new ApiError(403, 'User account is disabled');
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
  return { user: safeUser, token: signToken(user) };
}

