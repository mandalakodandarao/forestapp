# ForestRoots

ForestRoots is a production-ready full-stack marketplace connecting tribal communities, artisans, farmers, and forest-product producers directly with customers.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express.js microservices behind an API Gateway
- Database: PostgreSQL
- Authentication: JWT with role-based access control
- Tooling: Swagger, Docker, Docker Compose, Jest, ESLint

## Project Structure

```text
frontend/   React marketplace application
backend/    Original monolith reference implementation
services/   API Gateway, User, Product, Order, and Notification services
database/   PostgreSQL schemas and seed/init data
k8s/        Kubernetes manifests
docker/     Docker usage notes
docs/       API and architecture documentation
```

## Quick Start With Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- API Gateway health: http://localhost:8080/health
- Service health: http://localhost:4101/health, http://localhost:4102/health, http://localhost:4103/health, http://localhost:4104/health

## Local Development

Microservices:

```bash
cd services/user-service
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Database:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

## Roles

- Customer: browse, search, cart, checkout, order history, reviews.
- Seller: seller registration, product CRUD, inventory, orders, earnings.
- Admin: dashboard, seller approvals, product approvals, user management, analytics.

## Security and Production Notes

- Replace `JWT_SECRET` with a long random secret before deployment.
- Use HTTPS in production and configure `CLIENT_URL` to the deployed frontend origin.
- Store secrets in your deployment platform secret manager.
- Add payment gateway integration before accepting real payments.
- Configure database backups, migration tooling, and observability for production rollout.

## Tests

```bash
cd backend
npm test
```

The services are structured for `npm test`; the Jenkins pipeline runs tests, builds Docker images, pushes them, and deploys the Kubernetes manifests.

## Microservices

See [docs/MICROSERVICES.md](docs/MICROSERVICES.md) for service boundaries, ports, Kubernetes commands, and deployment notes.
