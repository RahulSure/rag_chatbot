# VM Deployment Guide (DigitalOcean droplet + Docker + nginx)

Deploys the Shrimali AI platform to a single Ubuntu VM with Docker Compose, behind
an nginx reverse proxy. Target droplet: `ubuntu-s-2vcpu-4gb-blr1` (Ubuntu 24.04,
2 vCPU / 4 GB) at `64.227.161.169`.

MongoDB (Atlas) and the Krutrim LLM are external — the VM runs only `api`, `web`,
and `redis`. The Celery `worker`/`beat` are left off initially (4 GB is tight with
the embedding model; do book ingestion locally as today).

---

## 0. One-time: SSH access

If `ssh root@64.227.161.169` fails with `Permission denied (publickey)`, add your
machine's public key via the DigitalOcean web console (Droplet → Access → Console),
logged in as root:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo '<paste ~/.ssh/id_ed25519.pub from your Mac>' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Then from your Mac: `ssh root@64.227.161.169`.

---

## 1. Install Docker + Compose (on the VM)

```bash
apt-get update -y && apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version && docker compose version
```

(4 GB RAM is enough to run the stack, but the `web` image build is memory-hungry.
Add 2 GB swap so the build doesn't get OOM-killed:)

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 2. Clone the repo

```bash
cd /opt
git clone https://github.com/RahulSure/rag_chatbot.git
cd rag_chatbot
git checkout productionize-chatbot     # until it is merged to main
```

The compressed hero videos + posters are in the repo, so the frontend is complete —
no separate media copy needed.

---

## 3. Configure secrets — `.env` at the repo root

```bash
cp .env.example .env
nano .env
```

Fill in the real values (these are NOT in git):

```
KRUTRIM_API_KEY=<real key>
MONGODB_URI=<real Atlas URI with user:password>
MONGODB_DB_NAME=dr-narayan-dutt
MONGODB_COLLECTION=books
HF_TOKEN=<real token>
ADMIN_SECRET=<a long random string>
CORS_ORIGINS=http://64.227.161.169
# Public base URL the BROWSER uses (IP now; your domain later). No trailing slash.
PUBLIC_BASE_URL=http://64.227.161.169
```

`REDIS_URL` / `CELERY_*` are set by the compose file to the internal `redis` service —
leave them as-is. **Never** set `REDIS_FAKE` on the server.

---

## 4. Build + run the containers

From `platform/infrastructure/`, use the base compose plus the production override
(binds ports to localhost, bakes the public API URL into the web build):

```bash
cd platform/infrastructure
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
```

This starts `api`, `web`, `redis` (not `worker`/`beat`). First build takes several
minutes (torch + embedding deps). Watch logs / health:

```bash
docker compose logs -f api        # wait for "Uvicorn running"
curl http://127.0.0.1:8000/health # {"status":"ok","vector_store_docs":625}
curl -I http://127.0.0.1:3000     # 200
```

> Why the override matters: Next.js inlines `NEXT_PUBLIC_API_URL` at **build** time.
> The override passes it as a build ARG (`${PUBLIC_BASE_URL}/api`) so the browser calls
> a real, same-origin URL. The base compose alone bakes `http://localhost:8000`, which
> the visitor's browser cannot reach.

---

## 5. nginx reverse proxy

```bash
apt-get install -y nginx
cp /opt/rag_chatbot/platform/infrastructure/nginx/shrimali.conf \
   /etc/nginx/sites-available/shrimali.conf
ln -sf /etc/nginx/sites-available/shrimali.conf /etc/nginx/sites-enabled/shrimali.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

The site is now at **http://64.227.161.169** — `/` serves the frontend, `/api/*` proxies
to the API (SSE streaming for chat is passed through unbuffered).

---

## 6. Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

The prod override binds `api`/`web`/`redis` to `127.0.0.1`, so only nginx is exposed —
ports 8000/3000/6379 are not reachable from the internet.

---

## 7. Verify end-to-end

```bash
curl http://64.227.161.169/api/health
curl -s -X POST http://64.227.161.169/api/query \
  -H 'Content-Type: application/json' \
  -d '{"question":"अप्सरा साधना क्या है?","top_k":5}'
```

Then open **http://64.227.161.169** in a browser: the home hero, the books section
(should list all 3 books), and the chat (ask a question — a streamed answer with
sources) should all work.

---

## 8. TLS (once you have a domain)

Point an A record at `64.227.161.169`, set `server_name your-domain.com;` in the nginx
conf and `PUBLIC_BASE_URL=https://your-domain.com` + `CORS_ORIGINS=https://your-domain.com`
in `.env`, rebuild web (`docker compose ... up -d --build web`), then:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## Updating after new commits

```bash
cd /opt/rag_chatbot && git pull
cd platform/infrastructure
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Optional: enable article generation (worker/beat)

Only if you need AI article generation, and preferably after upgrading to 8 GB:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d worker beat
```

## Troubleshooting

- **Web build OOM-killed** → ensure the 2 GB swap from step 1 is active (`free -h`).
- **Chat answer never streams** → confirm nginx `proxy_buffering off` is in the `/api/` block (it is in the shipped conf).
- **Browser calls localhost:8000** → the web image was built without the override; rebuild with `-f docker-compose.prod.yml` and `PUBLIC_BASE_URL` set.
- **`/books` empty / stats zero** → `.env` `MONGODB_COLLECTION` must be `books` and `MONGODB_DB_NAME` `dr-narayan-dutt`.
