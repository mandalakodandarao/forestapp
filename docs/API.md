# ForestRoots API Documentation

Interactive Swagger documentation is served by the backend at:

```text
http://localhost:4000/api/docs
```

## Authentication

Send JWTs in the `Authorization` header:

```text
Authorization: Bearer <token>
```

## Core Endpoints

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register customer or seller |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/categories` | Public | List categories |
| GET | `/api/products` | Public | Browse, search, and filter products |
| GET | `/api/products/:id` | Public | Product details |
| POST | `/api/checkout` | Customer | Create paid order and decrement inventory |
| GET | `/api/orders` | Customer | Order history |
| POST | `/api/products/:productId/reviews` | Customer | Create or update a review |
| GET | `/api/seller/products` | Approved seller | Seller inventory |
| POST | `/api/seller/products` | Approved seller | Create product for admin approval |
| PUT | `/api/seller/products/:id` | Approved seller | Update product |
| DELETE | `/api/seller/products/:id` | Approved seller | Delete product |
| GET | `/api/seller/orders` | Approved seller | Seller order items |
| GET | `/api/seller/earnings` | Approved seller | Earnings summary |
| GET | `/api/admin/dashboard` | Admin | Marketplace metrics |
| GET | `/api/admin/users` | Admin | User management |
| GET | `/api/admin/products` | Admin | Product management |
| PATCH | `/api/admin/sellers/:id/status` | Admin | Approve or reject seller |
| PATCH | `/api/admin/products/:id/status` | Admin | Approve or reject product |
| GET | `/api/admin/analytics` | Admin | Category sales analytics |
