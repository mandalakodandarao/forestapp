import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = header.slice(7);
  const payload = jwt.verify(token, env.JWT_SECRET);
  const { rows } = await query(
    'SELECT id, name, email, role, seller_status, is_active FROM users WHERE id = $1',
    [payload.sub]
  );

  const user = rows[0];
  if (!user || !user.is_active) {
    throw new ApiError(401, 'Invalid authentication token');
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }
  return next();
};

export const requireApprovedSeller = (req, _res, next) => {
  if (req.user?.role !== 'seller' || req.user.seller_status !== 'approved') {
    return next(new ApiError(403, 'Approved seller account required'));
  }
  return next();
};

