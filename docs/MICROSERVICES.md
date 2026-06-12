# ForestRoots Microservices Architecture

## Services

| Service | Port | Responsibility | Database |
| --- | --- | --- | --- |
| API Gateway | 8080 | Public edge routing, rate limiting, CORS, service proxying | None |
| User Service | 4101 | Registration, login, JWT identity, seller approval | `forestroots_users` |
| Product Service | 4102 | Categories, product catalog, seller inventory, product approval | `forestroots_products` |
| Order Service | 4103 | Checkout, order history, seller orders, earnings, admin sales analytics | `forestroots_orders` |
| Notification Service | 4104 | In-app notification creation, listing, read state | `forestroots_notifications` |

## Local URLs

- Gateway: http://localhost:8080/health
- User Service: http://localhost:4101/health
- Product Service: http://localhost:4102/health
- Order Service: http://localhost:4103/health
- Notification Service: http://localhost:4104/health

## Kubernetes

Apply manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml -f k8s/secrets.yaml -f k8s/postgres.yaml
kubectl apply -f k8s/deployments.yaml -f k8s/services.yaml -f k8s/ingress.yaml
```

Replace placeholder image names and secrets before production deployment.

