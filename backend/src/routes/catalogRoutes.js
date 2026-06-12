import { Router } from 'express';
import { getProduct, listCategories, listProductReviews, listProducts } from '../controllers/catalogController.js';
import { upsertReview } from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema, productListSchema, reviewSchema } from '../validators/schemas.js';

export const catalogRouter = Router();

catalogRouter.get('/categories', listCategories);
catalogRouter.get('/products', validate(productListSchema), listProducts);
catalogRouter.get('/products/:id', validate(idParamSchema), getProduct);
catalogRouter.get('/products/:productId/reviews', listProductReviews);
catalogRouter.post('/products/:productId/reviews', authenticate, authorize('customer'), validate(reviewSchema), upsertReview);

