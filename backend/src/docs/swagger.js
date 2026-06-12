import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ForestRoots API',
      version: '1.0.0',
      description: 'REST API for the ForestRoots tribal, artisan, farmer, and forest-product marketplace.'
    },
    servers: [{ url: 'http://localhost:4000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Auth' },
      { name: 'Catalog' },
      { name: 'Orders' },
      { name: 'Seller' },
      { name: 'Admin' }
    ],
    paths: {
      '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login with email and password' } },
      '/api/categories': { get: { tags: ['Catalog'], summary: 'List product categories' } },
      '/api/products': { get: { tags: ['Catalog'], summary: 'Browse, search, and filter approved products' } },
      '/api/products/{id}': { get: { tags: ['Catalog'], summary: 'Get product details' } },
      '/api/checkout': { post: { tags: ['Orders'], security: [{ bearerAuth: [] }], summary: 'Checkout cart items' } },
      '/api/orders': { get: { tags: ['Orders'], security: [{ bearerAuth: [] }], summary: 'Customer order history' } },
      '/api/seller/products': { get: { tags: ['Seller'], security: [{ bearerAuth: [] }], summary: 'List seller products' }, post: { tags: ['Seller'], security: [{ bearerAuth: [] }], summary: 'Create product' } },
      '/api/seller/orders': { get: { tags: ['Seller'], security: [{ bearerAuth: [] }], summary: 'View seller orders' } },
      '/api/seller/earnings': { get: { tags: ['Seller'], security: [{ bearerAuth: [] }], summary: 'Seller earnings dashboard' } },
      '/api/admin/dashboard': { get: { tags: ['Admin'], security: [{ bearerAuth: [] }], summary: 'Admin dashboard metrics' } },
      '/api/admin/users': { get: { tags: ['Admin'], security: [{ bearerAuth: [] }], summary: 'Manage users' } },
      '/api/admin/products': { get: { tags: ['Admin'], security: [{ bearerAuth: [] }], summary: 'Manage products' } },
      '/api/admin/analytics': { get: { tags: ['Admin'], security: [{ bearerAuth: [] }], summary: 'Marketplace analytics' } }
    }
  },
  apis: ['./src/routes/*.js']
});
