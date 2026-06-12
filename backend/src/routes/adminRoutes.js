import { Router } from 'express';
import { analytics, approveProduct, approveSeller, dashboard, manageProducts, manageUsers } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminStatusSchema } from '../validators/schemas.js';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('admin'));
adminRouter.get('/dashboard', dashboard);
adminRouter.get('/users', manageUsers);
adminRouter.get('/products', manageProducts);
adminRouter.patch('/sellers/:id/status', validate(adminStatusSchema), approveSeller);
adminRouter.patch('/products/:id/status', validate(adminStatusSchema), approveProduct);
adminRouter.get('/analytics', analytics);
