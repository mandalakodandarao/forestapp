import { Router } from 'express';
import { checkout, orderHistory } from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderSchema } from '../validators/schemas.js';

export const orderRouter = Router();

orderRouter.use(authenticate, authorize('customer'));
orderRouter.post('/checkout', validate(orderSchema), checkout);
orderRouter.get('/orders', orderHistory);

