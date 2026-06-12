import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8080);

const services = {
  users: process.env.USER_SERVICE_URL || 'http://user-service:4101',
  products: process.env.PRODUCT_SERVICE_URL || 'http://product-service:4102',
  orders: process.env.ORDER_SERVICE_URL || 'http://order-service:4103',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4104'
};

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', upstreams: services });
});

function proxy(path, target) {
  const middleware = createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error(error, _req, res) {
        res.status(502).json({ message: 'Upstream service unavailable', detail: error.message });
      }
    }
  });

  app.use(path, (req, res, next) => {
    req.url = `${path}${req.url}`;
    middleware(req, res, next);
  });
}

proxy('/api/users', services.users);
proxy('/api/auth', services.users);
proxy('/api/admin/users', services.users);
proxy('/api/admin/sellers', services.users);
proxy('/api/admin/products', services.products);
proxy('/api/admin/dashboard', services.orders);
proxy('/api/admin/analytics', services.orders);
proxy('/api/seller/products', services.products);
proxy('/api/seller/orders', services.orders);
proxy('/api/seller/earnings', services.orders);
proxy('/api/products', services.products);
proxy('/api/categories', services.products);
proxy('/api/orders', services.orders);
proxy('/api/checkout', services.orders);
proxy('/api/notifications', services.notifications);

app.use((_req, res) => res.status(404).json({ message: 'Gateway route not found' }));

app.listen(port, () => {
  console.log(`ForestRoots API Gateway listening on ${port}`);
});
