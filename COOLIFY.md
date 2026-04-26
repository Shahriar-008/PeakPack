# Deploying PeakPack on Coolify

This guide walks through deploying PeakPack using [Coolify](https://coolify.io) — a self-hosted PaaS that handles SSL, reverse proxying (Traefik), and container orchestration.

## Architecture

```
yourdomain.com          → Coolify Traefik → frontend:3000  (Next.js)
api.yourdomain.com      → Coolify Traefik → api:4000       (Express + Socket.IO)
media.yourdomain.com    → Coolify Traefik → MinIO          (object storage)
```

Services **not** in the Docker Compose (managed as Coolify Resources):
- PostgreSQL 16
- Redis 7
- MinIO

---

## Step 1 — Install Coolify on your VPS

SSH into your VPS and run the Coolify installer:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Then open `http://YOUR_VPS_IP:8000` and complete the initial setup.

> [!TIP]
> Coolify needs ports **80** and **443** open on your VPS firewall.
> Port **8000** is the Coolify dashboard (keep it firewalled from public access in production).

---

## Step 2 — Connect your Git repository

1. In Coolify → **Sources** → **Add** → **GitHub**
2. Follow the GitHub App installation flow
3. Select the `peakpack` repository and grant access

---

## Step 3 — Create Coolify Resources

Go to your **Project** → **New Resource** for each of the following:

### PostgreSQL 16

| Setting | Value |
|---------|-------|
| Resource type | PostgreSQL |
| Version | 16 |
| Database name | `peakpack` |
| Username | `peakpack` |

After creating, copy the **Connection String** — it will be your `DATABASE_URL`.

### Redis 7

| Setting | Value |
|---------|-------|
| Resource type | Redis |
| Version | 7 |

Copy the **Connection String** — it will be your `REDIS_URL`.

### MinIO

| Setting | Value |
|---------|-------|
| Resource type | MinIO |
| Domain | `media.yourdomain.com` |

After creating:
1. Open the MinIO console at `media.yourdomain.com` (or port 9001)
2. Create two buckets: `avatars` and `progress-photos`
3. Set both buckets to **public read** (for serving images)
4. Copy the **Access Key** and **Secret Key**

---

## Step 4 — Create the Docker Compose Application

1. Go to your **Project** → **New Resource** → **Docker Compose**
2. Select your GitHub repo
3. Set **Docker Compose file** to: `docker-compose.coolify.yml`
4. Click **Save**

---

## Step 5 — Configure Domains

In the resource settings, expand each service and set its domain:

| Service | Domain |
|---------|--------|
| `frontend` | `yourdomain.com` |
| `api` | `api.yourdomain.com` |
| `worker` | *(none — internal only)* |

Coolify will auto-provision SSL certificates via Let's Encrypt for each domain.

---

## Step 6 — Set Environment Variables

In the resource → **Environment Variables** tab, add all of the following:

```env
# ── App ──────────────────────────────────────────────────────
NODE_ENV=production
APP_URL=https://yourdomain.com

# ── Database (from Step 3) ───────────────────────────────────
DATABASE_URL=postgresql://peakpack:PASSWORD@HOST:5432/peakpack

# ── Redis (from Step 3) ──────────────────────────────────────
REDIS_URL=redis://HOST:6379

# ── Auth ──────────────────────────────────────────────────────
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
JWT_ACCESS_SECRET=<run: openssl rand -base64 32>
JWT_REFRESH_SECRET=<run: openssl rand -base64 32>
BCRYPT_ROUNDS=12
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# ── MinIO (from Step 3) ──────────────────────────────────────
MINIO_ENDPOINT=<MinIO internal hostname in Coolify>
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET_AVATARS=avatars
MINIO_BUCKET_PHOTOS=progress-photos
MINIO_PUBLIC_URL=https://media.yourdomain.com

# ── Email (SMTP) ──────────────────────────────────────────────
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
EMAIL_FROM="PeakPack <noreply@yourdomain.com>"

# ── Frontend public vars (baked into Next.js build) ───────────
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com

# ── CORS (must match your frontend domain exactly) ───────────
SOCKET_CORS_ORIGIN=https://yourdomain.com
```

> [!IMPORTANT]
> `NEXT_PUBLIC_*` variables are baked into the Next.js build at compile time.
> If you change them, you must **redeploy** (not just restart) the frontend.

> [!NOTE]
> For the MinIO internal hostname: in Coolify, resources on the same server can
> communicate via the internal Docker hostname shown in the resource's connection
> details (usually something like `peakpack-minio` or the container name).

---

## Step 7 — Set Pre-deploy Command (Prisma Migrations)

In the **api** service settings:

| Setting | Value |
|---------|-------|
| Pre-deploy command | `npx prisma migrate deploy` |

This runs automatically before each deploy to apply any pending migrations.

---

## Step 8 — Deploy

Click **Deploy** in the Coolify UI.

Coolify will:
1. Pull your repo from GitHub
2. Build the Docker images for `frontend`, `api`, and `worker`
3. Run `npx prisma migrate deploy` (pre-deploy)
4. Start all containers
5. Issue SSL certificates
6. Wire up Traefik routing

Watch the **Logs** tab to monitor progress.

---

## Step 9 — Verify Deployment

Once deployed, run these checks:

```bash
# 1. Frontend loads
curl -I https://yourdomain.com

# 2. API health check
curl https://api.yourdomain.com/api/health
# Expected: {"data":{"status":"healthy",...}}

# 3. Metrics endpoint
curl https://api.yourdomain.com/api/metrics
# Expected: Prometheus text format

# 4. Socket.IO handshake
curl "https://api.yourdomain.com/socket.io/?EIO=4&transport=polling"
# Expected: Socket.IO session response
```

Then open `https://yourdomain.com` in a browser, sign up, and complete the onboarding flow.

---

## Step 10 — Set Up GitHub Actions (CI/CD)

Add these secrets to your GitHub repository (**Settings → Secrets → Actions**):

| Secret | Where to get it |
|--------|----------------|
| `COOLIFY_DEPLOY_WEBHOOK` | Coolify UI → Resource → **Webhooks** tab → Deploy Webhook URL |
| `COOLIFY_API_TOKEN` | Coolify UI → **Profile** → **API Tokens** → Create |

Now every push to `main` will:
1. Type-check backend + frontend
2. On success → trigger Coolify to redeploy automatically

---

## Useful Coolify Commands (via UI Terminal)

Access the terminal for any service in Coolify → Resource → **Terminal**:

```bash
# Run Prisma migrations manually
npx prisma migrate deploy

# Open Prisma Studio (inspect the database)
npx prisma studio

# Check logs
docker logs peakpack-api-1 --tail 100 -f
```

---

## Google OAuth Setup

In the [Google Cloud Console](https://console.cloud.google.com):

1. Create OAuth 2.0 credentials
2. Add authorized redirect URIs:
   - `https://api.yourdomain.com/api/auth/google/callback`
3. Add authorized JavaScript origins:
   - `https://yourdomain.com`
   - `https://api.yourdomain.com`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API returns 502 | Check api service logs; likely `DATABASE_URL` or `REDIS_URL` wrong |
| Socket.IO disconnects | Ensure `SOCKET_CORS_ORIGIN` matches frontend domain exactly |
| Images not loading | Check `MINIO_PUBLIC_URL` and bucket public-read policy |
| Google OAuth fails | Check redirect URI in Google Console matches `api.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` wrong in browser | Redeploy (not restart) frontend after changing this var |
| Migrations fail on deploy | Check `DATABASE_URL` is reachable from the api container |
