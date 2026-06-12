# Docker Notes

The root `docker-compose.yml` starts PostgreSQL, the API Gateway, all domain services, and the React app.

```bash
cp .env.example .env
docker compose up --build
```

Useful URLs:

- Frontend: http://localhost:5173
- Gateway health: http://localhost:8080/health
- User service health: http://localhost:4101/health
- Product service health: http://localhost:4102/health
- Order service health: http://localhost:4103/health
- Notification service health: http://localhost:4104/health
