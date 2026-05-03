# PeakPack VPS Deployment Setup

This guide walks through setting up VPS deployment for PeakPack using GitHub Actions and SSH.

## Architecture

```
GitHub Actions (CI/CD)
  ↓ (type-check passes)
  ↓ (SSH deploy)
VPS Server
  ├─ nginx (reverse proxy, SSL)
  ├─ frontend (Next.js)
  ├─ api (Express + Socket.IO)
  ├─ worker (BullMQ)
  ├─ redis (cache + job queue)
```

**External Services:**
- **Supabase** — PostgreSQL, Auth, and Storage (managed)
- **Let's Encrypt** — SSL certificates (manual setup on VPS)

---

## Prerequisites

Before deploying to VPS, ensure you have:

1. **VPS with Docker & Docker Compose**
   - OS: Ubuntu 20.04+ or similar Linux
   - Docker 20.10+
   - Docker Compose 2.0+
   - OpenSSH server running
   - Git installed

2. **SSH access to VPS**
   - Test: `ssh -i ~/.ssh/id_ed25519 user@vps-hostname`

3. **Supabase project**
   - Database URL (connection string)
   - Service Role Key (for backend)
   - Anon Key (for frontend)
   - API URL

4. **SMTP credentials** (for email notifications)
   - Host, port, username, password

5. **Domain name** with DNS pointing to VPS IP

---

## Step 1: Prepare VPS

### 1.1 Create deployment directory

SSH into your VPS and create the application directory:

```bash
# Create app directory
sudo mkdir -p /opt/peakpack
sudo chown $USER:$USER /opt/peakpack
cd /opt/peakpack

# Initialize as git repo (CI/CD will pull here)
git init
git remote add origin https://github.com/YOUR_USERNAME/peakpack.git
```

### 1.2 Create `.env` file on VPS

On the VPS, create `/opt/peakpack/.env` with your configuration:

```bash
cat > /opt/peakpack/.env << 'EOF'
# ── App ────────────────────────────────────────────────────
NODE_ENV=production
APP_URL=https://yourdomain.com

# ── Supabase ───────────────────────────────────────────────
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# ── Database ───────────────────────────────────────────────
DATABASE_URL=postgresql://postgres.YOUR_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

# ── Redis ──────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Email (SMTP) ───────────────────────────────────────────
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
EMAIL_FROM="PeakPack <noreply@yourdomain.com>"

# ── Socket.IO / CORS ───────────────────────────────────────
SOCKET_CORS_ORIGIN=https://yourdomain.com

# ── Frontend public vars ───────────────────────────────────
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
EOF

chmod 600 /opt/peakpack/.env
```

> **⚠️ Important:** The `.env` file contains secrets and should never be committed to git.

### 1.3 Set up Let's Encrypt SSL certificates

Install Certbot and obtain certificates:

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate for your domain
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d api.yourdomain.com

# Verify certificates were installed
ls -la /etc/letsencrypt/live/yourdomain.com/
```

Certificates will be at:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

The `docker-compose.vps.yml` mounts these read-only in the nginx container.

### 1.4 Do an initial manual deployment

Pull the repo and test the deployment script locally:

```bash
cd /opt/peakpack
git pull origin main

# Run the deployment script
bash scripts/deploy-vps.sh /opt/peakpack

# Watch the logs
tail -f deploy.log
```

If successful, you should see all 7 deployment steps complete.

---

## Step 2: Generate SSH Key for GitHub Actions

Generate an SSH key pair specifically for CI/CD deployments:

### 2.1 On your local machine (or VPS), generate key

```bash
# Generate Ed25519 key (recommended, more secure and compact)
ssh-keygen -t ed25519 -f ~/.ssh/peakpack_deploy -N ""

# Or use RSA (if Ed25519 not available)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/peakpack_deploy -N ""

# Display the private key (you'll need this for GitHub)
cat ~/.ssh/peakpack_deploy
```

### 2.2 Add public key to VPS

Add the public key to authorized_keys on the VPS:

```bash
# On VPS, add the public key
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... peakpack_deploy
EOF

chmod 600 ~/.ssh/authorized_keys

# Verify SSH login works with the new key
# (from your local machine)
ssh -i ~/.ssh/peakpack_deploy user@vps-hostname "echo 'SSH works!'"
```

---

## Step 3: Configure GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Value | Example |
|---|---|---|
| `VPS_SSH_PRIVATE_KEY` | Private SSH key (entire file content) | `-----BEGIN OPENSSH PRIVATE KEY-----` ... |
| `VPS_HOSTNAME` | VPS IP or hostname | `123.45.67.89` or `vps.example.com` |
| `VPS_USER` | SSH username on VPS | `ubuntu` or `deploy` |
| `VPS_APP_PATH` | Path to app directory on VPS | `/opt/peakpack` |

### 3.1 Adding the SSH key secret

The easiest way:

```bash
# Copy private key to clipboard
cat ~/.ssh/peakpack_deploy | pbcopy  # macOS
# or
cat ~/.ssh/peakpack_deploy | xclip -selection clipboard  # Linux
```

Then in GitHub:
1. Go to **Settings → Secrets → Actions → New repository secret**
2. Name: `VPS_SSH_PRIVATE_KEY`
3. Paste the entire private key content
4. Click **Add secret**

Repeat for the other 3 secrets.

---

## Step 4: Test the CI/CD Pipeline

### 4.1 Trigger a deployment

Make a small commit to `main` and push:

```bash
git add .
git commit -m "test: trigger VPS deployment"
git push origin main
```

### 4.2 Watch the GitHub Actions workflow

Go to **Actions** tab in GitHub and click on your workflow run. You should see:

1. ✅ **typecheck** job runs and passes
2. ✅ **deploy-vps** job starts (waits for typecheck)
3. ✅ SSH connection established
4. ✅ Deployment script runs
5. ✅ Health checks pass

### 4.3 Verify on VPS

After the workflow completes, SSH into your VPS and check:

```bash
# View deployment log
tail -100 /opt/peakpack/deploy.log

# Check Docker status
docker compose -f /opt/peakpack/docker-compose.vps.yml ps

# Check API health
curl -I http://localhost:4000/api/healthz

# Check Frontend
curl -I http://localhost:3000/api/health
```

---

## Troubleshooting

### SSH connection fails in GitHub Actions

**Error:** `Permission denied (publickey)`

**Causes:**
- SSH key not added to VPS authorized_keys
- Wrong VPS_USER secret
- Key format mismatch

**Fix:**
1. Verify SSH key was added to VPS: `cat ~/.ssh/authorized_keys` (should see your key)
2. Test locally first: `ssh -i ~/.ssh/peakpack_deploy user@hostname`
3. Double-check `VPS_USER` and `VPS_HOSTNAME` secrets

### Deployment script fails during docker-compose build

**Error:** `docker compose build failed`

**Causes:**
- Docker daemon not running
- Out of disk space
- Invalid Dockerfile

**Fix:**
1. SSH into VPS and check: `docker ps`
2. Check disk space: `df -h`
3. View build logs: `docker compose -f docker-compose.vps.yml build --no-cache 2>&1 | tail -50`

### API fails health check after deployment

**Error:** `API failed health check after 12 attempts`

**Causes:**
- Database not reachable
- Redis not started
- Invalid environment variables
- Migration failed

**Fix:**
1. Check logs: `docker compose -f docker-compose.vps.yml logs api --tail 50`
2. Verify DATABASE_URL: `echo $DATABASE_URL`
3. Check redis: `docker compose -f docker-compose.vps.yml logs redis`
4. View deployment log: `cat /opt/peakpack/deploy.log`

### Nginx returns 502 Bad Gateway

**Error:** Visiting `https://yourdomain.com` returns 502

**Causes:**
- Frontend or API not running
- nginx config pointing to wrong service
- SSL certificate issue

**Fix:**
```bash
# Check service status
docker compose -f docker-compose.vps.yml ps

# Check nginx logs
docker compose -f docker-compose.vps.yml logs nginx --tail 50

# Verify nginx config
docker exec peakpack-nginx-1 nginx -t
```

### SSL certificate issues

**Error:** `SSL certificate not found` or `CERTIFICATE_VERIFY_FAILED`

**Fix:**
1. Verify certificates exist: `ls -la /etc/letsencrypt/live/yourdomain.com/`
2. Renew if expired: `sudo certbot renew --force-renewal`
3. Check permissions: `sudo ls -la /etc/letsencrypt/live/yourdomain.com/privkey.pem`

---

## Manual Deployment

If you need to deploy without GitHub Actions:

```bash
# SSH into VPS
ssh user@vps-hostname

# Go to app directory
cd /opt/peakpack

# Pull latest code
git pull origin main

# Run deployment script
bash scripts/deploy-vps.sh /opt/peakpack

# Watch logs
tail -f deploy.log
```

---

## Updating Environment Variables

To update environment variables (e.g., new API URLs, SMTP settings):

1. **Update on VPS:**
   ```bash
   # Edit .env file
   nano /opt/peakpack/.env
   
   # Exit nano with Ctrl+X, then Y to save
   
   # Restart services to pick up new env vars
   docker compose -f /opt/peakpack/docker-compose.vps.yml restart
   ```

2. **Or trigger full redeploy:**
   ```bash
   # Make a dummy commit to trigger GitHub Actions
   git commit --allow-empty -m "redeploy: update env vars"
   git push origin main
   ```

> **Note:** `NEXT_PUBLIC_*` variables require a **rebuild** of the frontend image (not just restart).
> The deploy script already does this with `--build` flag.

---

## Rollback Procedure

If a deployment goes wrong:

```bash
# SSH into VPS
ssh user@vps-hostname
cd /opt/peakpack

# View git history
git log --oneline | head -10

# Revert to previous commit
git reset --hard HEAD~1

# Redeploy
bash scripts/deploy-vps.sh /opt/peakpack

# Watch logs
tail -f deploy.log
```

Or use GitHub Actions to trigger a redeploy by pushing to main again.

---

## Monitoring

### View real-time logs

```bash
# API logs
docker compose -f /opt/peakpack/docker-compose.vps.yml logs -f api

# Frontend logs
docker compose -f /opt/peakpack/docker-compose.vps.yml logs -f frontend

# Worker logs
docker compose -f /opt/peakpack/docker-compose.vps.yml logs -f worker

# nginx logs
docker compose -f /opt/peakpack/docker-compose.vps.yml logs -f nginx
```

### Health checks

```bash
# API health
curl https://api.yourdomain.com/api/healthz

# Frontend health
curl https://yourdomain.com/api/health

# Prometheus metrics
curl https://api.yourdomain.com/api/metrics
```

---

## Security Considerations

1. **SSH Key Security**
   - Keep private key (`peakpack_deploy`) secure; never commit it
   - Rotate keys periodically
   - Use Ed25519 (stronger than RSA)

2. **Environment Variables**
   - Never commit `.env` file to git
   - Secrets should only be in `/opt/peakpack/.env` on VPS
   - Use GitHub Secrets for CI/CD credentials

3. **Firewall Rules**
   - Only allow SSH (port 22) from trusted IPs
   - Allow HTTP (80) and HTTPS (443) for public access
   - Close other ports

4. **SSL Certificates**
   - Set up automatic renewal: `sudo systemctl enable certbot-renew.timer`
   - Check renewal status: `sudo certbot renew --dry-run`

---

## Migration from Coolify to VPS

If you previously used Coolify webhooks:

1. **Keep the old deploy.yml:**
   - Existing Coolify deployments can continue working
   - You now have both deployment options

2. **To fully switch:**
   - Test VPS deployment thoroughly
   - Delete Coolify resources when confident
   - Update any documentation/dashboards

3. **DNS:** No changes needed if using same VPS

---

## Next Steps

- ✅ Set up VPS directory and .env
- ✅ Generate SSH key and add to VPS
- ✅ Configure GitHub Secrets
- ✅ Test CI/CD pipeline
- ✅ Verify deployment health
- Monitor and iterate

If you have issues, check the logs first:
```bash
# GitHub Actions logs: https://github.com/YOUR_USERNAME/peakpack/actions
# VPS deployment log: /opt/peakpack/deploy.log
# Docker logs: docker compose -f docker-compose.vps.yml logs <service>
```
