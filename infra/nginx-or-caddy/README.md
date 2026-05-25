# Nginx Reverse Proxy

Nginx configuration for the Dragon Ecosystem production deployment.

## File

`nginx.conf` — single-file config with three server blocks (web, API, admin) and three upstream blocks.

## Routing

| Domain              | Backend        | Port |
| ------------------- | -------------- | ---- |
| `YOUR_DOMAIN`       | Nuxt Web (SSR) | 3001 |
| `YOUR_API_DOMAIN`   | NestJS API     | 3000 |
| `YOUR_ADMIN_DOMAIN` | Nuxt Admin     | 3002 |

All HTTP traffic is redirected to HTTPS. MongoDB (27017) and Redis (6379) are never exposed through the proxy.

## Before deploying

1. Replace all `YOUR_DOMAIN`, `YOUR_API_DOMAIN`, `YOUR_ADMIN_DOMAIN` placeholders with real values.
2. Place TLS certificates at the paths referenced in each `ssl_certificate` / `ssl_certificate_key` directive (Let's Encrypt or Arvan CDN).
3. Do not commit real domain names, TLS keys, or credentials to this repository.

## Security invariants

- `server_tokens off` — nginx version is not exposed.
- `client_max_body_size 50m` on the API block — supports media uploads.
- `client_max_body_size 1m` default for web and admin.
- `X-Robots-Tag: noindex,nofollow,noarchive` on the admin server block — admin never appears in search indexes.
- `Strict-Transport-Security` with 63072000 s (two years) + `preload` on all HTTPS blocks.
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on all HTTPS blocks.
- `proxy_set_header X-Forwarded-Proto $scheme` — NestJS and Nuxt can detect HTTPS correctly.
- `proxy_set_header X-Real-IP` / `X-Forwarded-For` — accurate IP forwarding for analytics IP hashing.

## Out of scope (Task 0.10.1)

Docker Compose wiring (which mounts this file into an nginx container) is Task 0.10.2.
Health check endpoints and structured logging are Task 0.10.3.
