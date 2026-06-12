import { Router } from 'express';
import {
  createProduct,
  deleteSellerProduct,
  listSellerProducts,
  sellerEarnings,
  sellerOrders,
  updateSellerProduct
} from '../controllers/sellerController.js';
import { authenticate, requireApprovedSeller } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema, productSchema } from '../validators/schemas.js';

export const sellerRouter = Router();

sellerRouter.use(authenticate, requireApprovedSeller);
sellerRouter.get('/products', listSellerProducts);
sellerRouter.post('/products', validate(productSchema), createProduct);
sellerRouter.put('/products/:id', validate(idParamSchema.merge(productSchema)), updateSellerProduct);
sellerRouter.delete('/products/:id', validate(idParamSchema), deleteSellerProduct);
sellerRouter.get('/orders', sellerOrders);
sellerRouter.get('/earnings', sellerEarnings);

