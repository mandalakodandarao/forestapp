import { z } from 'zod';

const uuid = z.string().uuid();

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(160),
    email: z.string().email().max(180),
    password: z.string().min(8).max(128),
    role: z.enum(['customer', 'seller']).default('customer')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const productListSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  })
});

export const idParamSchema = z.object({ params: z.object({ id: uuid }) });

export const productSchema = z.object({
  body: z.object({
    category_id: uuid,
    name: z.string().min(3).max(180),
    description: z.string().min(20),
    price: z.coerce.number().nonnegative(),
    inventory_count: z.coerce.number().int().nonnegative(),
    image_url: z.string().url().optional().nullable(),
    origin_region: z.string().max(160).optional().nullable()
  })
});

export const orderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product_id: uuid,
      quantity: z.coerce.number().int().positive()
    })).min(1),
    shipping_address: z.object({
      line1: z.string().min(3),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postal_code: z.string().min(3),
      country: z.string().min(2)
    })
  })
});

export const reviewSchema = z.object({
  params: z.object({ productId: uuid }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(1000).optional()
  })
});

export const adminStatusSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    status: z.enum(['approved', 'rejected'])
  })
});

