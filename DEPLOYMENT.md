# SPECS BUDDY WhatsApp Marketing Suite - Production Deployment Guide

This guide covers deploying SPECS BUDDY to your own VPS / Cloud Server (e.g. AWS EC2, DigitalOcean, Hetzner, Linode, Hostinger) with Docker, PostgreSQL, Redis, Nginx, and an SSL certificate.

---

## Architecture Overview

```
                                      [ Internet / User Browser ]
                                                  │
                                                  ▼
                                      [ Meta WhatsApp Webhooks ]
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │    Nginx Proxy       │  Port 80 / 443 (SSL)
                                       └──────────┬───────────┘
                                                  │
                   ┌──────────────────────────────┴──────────────────────────────┐
                   ▼                                                             ▼
     ┌───────────────────────────┐                                 ┌───────────────────────────┐
     │  SPECS BUDDY App (Next.js) │  Port 3000                     │  Campaign Worker (Node.js)│
     └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                   │                                                             │
         ┌─────────┴─────────┐                                         ┌─────────┴─────────┐
         ▼                   ▼                                         ▼                   ▼
┌──────────────────┐  ┌──────────────┐                        ┌──────────────────┐  ┌──────────────┐
│ PostgreSQL 16 DB │  │   Redis 7    │                        │ PostgreSQL 16 DB │  │   Redis 7    │
└──────────────────┘  └──────────────┘                        └──────────────────┘  └──────────────┘
```

---

## 1. Server Preparation (Ubuntu 22.04 / 24.04 LTS)

### Step 1: Update Server Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Docker & Docker Compose
```bash
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Verify installation:
```bash
docker --version
docker compose version
```

---

## 2. Deploy SPECS BUDDY with Docker Compose

### Step 1: Clone or Transfer Project Files to Server
```bash
git clone <your-repository-url> /opt/specs-buddy
cd /opt/specs-buddy
```

### Step 2: Configure Production Environment Variables
Edit `.env`:
```bash
nano .env
```
Ensure you update:
- `NEXT_PUBLIC_APP_URL="https://yourdomain.com"`
- `JWT_SECRET="<generate_a_random_32_character_string>"`
- `META_APP_ID="your_meta_app_id"`
- `META_WABA_ID="your_waba_id"`
- `META_PHONE_NUMBER_ID="your_phone_number_id"`
- `META_ACCESS_TOKEN="your_system_user_token"`
- `META_APP_SECRET="your_meta_app_secret"`
- `META_WEBHOOK_VERIFY_TOKEN="your_custom_secure_verify_token"`
- `META_TEST_MODE="false"` (Switch to false for real WhatsApp Cloud API delivery!)

### Step 3: Switch Prisma Datasource to PostgreSQL
In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Or copy `prisma/schema.postgresql.prisma` over `prisma/schema.prisma`:
```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

### Step 4: Build and Start Containers
```bash
docker compose up -d --build
```

### Step 5: Run Database Migrations and Seed Admin User
```bash
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

---

## 3. Custom Domain & SSL Setup (Certbot)

Meta requires all WhatsApp Cloud API Webhook endpoints to use a valid HTTPS SSL connection!

### Option A: Certbot on Host
1. Install Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. Point your custom domain's DNS `A Record` to your server's public IP address.
3. Generate SSL certificate:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```
4. Copy or mount certificates into `nginx/ssl`:
   ```bash
   mkdir -p ./nginx/ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/key.pem
   ```
5. Reload Nginx:
   ```bash
   docker compose restart nginx
   ```

---

## 4. Monitoring & Maintenance

### View Application Logs
```bash
docker compose logs -f app
```

### View Background Campaign Worker Logs
```bash
docker compose logs -f worker
```

### Database Backup
```bash
docker compose exec postgres pg_dump -U specsbuddy_user specsbuddy_db > backup_$(date +%F).sql
```

### Database Restore
```bash
cat backup_2026-11-06.sql | docker compose exec -T postgres psql -U specsbuddy_user -d specsbuddy_db
```
