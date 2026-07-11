# Docker Setup (nginx + web + api)

Simple single-host stack. No Kubernetes. nginx is the only public entrypoint.

```
                     ┌────────────────────────────┐
   browser  ──:80──▶ │  nginx (sadhak-nginx)       │
                     │   /       → web:3000        │
                     │   /api/*  → api:8000 (strip)│
                     └──────┬───────────┬──────────┘
                            │           │
                   ┌────────▼──┐   ┌────▼─────────┐   ┌──────────┐
                   │ web       │   │ api          │──▶│ redis    │
                   │ Next.js   │   │ FastAPI      │   │          │
                   │ :3000     │   │ :8000        │   └──────────┘
                   └───────────┘   └──────────────┘
   (SSR in web talks to api directly over the Docker network via API_INTERNAL_URL)
```

## Run

```bash
docker compose up -d --build      # build + start everything
docker compose ps                 # status
docker compose logs -f nginx api  # tail logs
docker compose down               # stop
```

Then open **http://localhost/** (frontend) — the app calls the backend at
`http://localhost/api/...`, which nginx forwards to FastAPI.

## How the API URL is wired

The frontend uses a single base URL that resolves differently per context:

- **Browser** → `NEXT_PUBLIC_API_URL=/api` (same-origin, baked at build time). Requests
  go to `http://<host>/api/...` and nginx strips `/api` before forwarding.
- **Server-side rendering** (inside the web container) → `API_INTERNAL_URL=http://api:8000`,
  a direct hop over the Docker network (a relative path can't be fetched server-side).

Because the browser path is relative, the stack works on `localhost` or any domain
with **no rebuild** — just put a TLS terminator / DNS in front of nginx.

## Notes

- `.env` (repo root) is loaded into the `api` container. `REDIS_URL` is overridden to
  point at the `redis` service.
- `./data` is bind-mounted into the api container at `/app/data`.
- Only port **80** is published. `web`, `api`, and `redis` are reachable only inside
  the compose network.
- FastAPI's data endpoints (`/query`, `/books`, `/articles`, …) are served at the API
  root, so they map cleanly through the `/api/` strip. The Swagger UI is configured at
  `/api/docs` on the API itself, i.e. `http://localhost/api/api/docs` through the proxy.

## Adding HTTPS later

Point a TLS proxy (Caddy, or nginx with certbot) at this nginx, or add a `443` server
block here and mount certs. Nothing in the app needs to change — the frontend already
uses a relative, scheme-agnostic API path.
```
