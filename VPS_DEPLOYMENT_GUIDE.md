# GPK Crackers - VPS Deployment Guide (Root & Local Database)

Complete guide for deploying **GPK Crackers Chit Scheme Platform** on your own Ubuntu/Debian VPS server as **`root`** with local **MongoDB** and domain **`gpk-chits.gemshine.tech`** on **Port `5033`**.

---

## 🏗 Architecture on Your Server

```
Internet (Customers & Admin)
          │
          ▼ (Ports 80 / 443 HTTPS)
    ┌───────────┐
    │   Nginx   │ (Domain: gpk-chits.gemshine.tech)
    └─────┬─────┘
          │
          ├───► Static Files (`/var/www/gpk-chit/dist`) ──► React SPA (Vite)
          │
          └───► `/api/*` (Reverse Proxy) ──► Node.js Backend (`127.0.0.1:5033`)
                                                │
                                                ▼ (PM2 Managed)
                                          Local MongoDB Server
                                          (`127.0.0.1:27017/gpk_chit`)
```

---

## 📋 Quick Specs

| Parameter | Configuration Value |
|---|---|
| **User** | `root` |
| **Domain** | `gpk-chits.gemshine.tech` |
| **Backend Port** | `5033` |
| **Database** | Local MongoDB (`mongodb://127.0.0.1:27017/gpk_chit`) |
| **Process Manager** | PM2 (`gpk-chit-backend`) |
| **Web Server / Reverse Proxy** | Nginx |
| **SSL / HTTPS** | Free Let's Encrypt SSL via Certbot |

---

## 🌐 Step 1: DNS Setup (Before starting)

In your DNS provider (Cloudflare, GoDaddy, Namecheap, Hostinger, etc.):
- Add an **A Record**:
  - **Type**: `A`
  - **Host / Name**: `gpk-chits` (or `gpk-chits.gemshine.tech`)
  - **Points to**: `YOUR_VPS_PUBLIC_IP`
  - **TTL**: Auto or 300 seconds

---

## 🚀 Step 2: Connect to Your VPS as Root

Open terminal or PowerShell on your computer and SSH into your server:
```bash
ssh root@YOUR_VPS_PUBLIC_IP
```

---

## ⚡ Step 3: Run the Automated VPS Provisioning Script

This single command installs **Node.js 20 LTS**, **PM2**, **Local MongoDB Community Server**, **Nginx**, **UFW Firewall**, and **Certbot**:

```bash
# Move to /root or /var/www
mkdir -p /var/www/gpk-chit
cd /var/www/gpk-chit

# Clone or pull your repository
git clone https://github.com/YOUR_GITHUB_USERNAME/gpk-chit.git .
# (Or if you have code already on your server, enter that directory)

# Make setup script executable and run it
chmod +x setup-vps.sh deploy.sh
./setup-vps.sh
```

> **What `setup-vps.sh` does automatically:**
> 1. Installs official **MongoDB Community Edition** locally on the VPS.
> 2. Starts & enables the `mongod` systemd service (`127.0.0.1:27017`).
> 3. Installs **Node.js 20 LTS** & **PM2**.
> 4. Configures UFW firewall (SSH 22, HTTP 80, HTTPS 443).
> 5. Installs Nginx and copies `nginx.gpkcrackers.conf` for `gpk-chits.gemshine.tech`.

---

## 🗄 Step 4: Verify Local MongoDB is Running

Check that your local database server is active:
```bash
systemctl status mongod
```
*(If it shows `active (running)`, local MongoDB is operational).*

---

## ⚙ Step 5: Verify the Backend `.env` File

Check or create `/var/www/gpk-chit/server/.env`:
```bash
nano /var/www/gpk-chit/server/.env
```

Ensure it contains the following:
```env
PORT=5033
NODE_ENV=production

# Frontend URL
CLIENT_URL=http://localhost:5033,http://localhost:8080,https://gpk-chits.gemshine.tech,http://gpk-chits.gemshine.tech

# Database - Local VPS MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/gpk_chit

# Authentication
JWT_SECRET=gpk_chit_scheme_super_secret_jwt_key_2026
JWT_EXPIRE=7d

# Admin Credentials
ADMIN_EMAIL=admin@gpkcrackers.com
ADMIN_PASSWORD=admin321

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=daxl7y5um
CLOUDINARY_API_KEY=579937718567788
CLOUDINARY_API_SECRET=e2euCuyOQycviFSHMYhBK-miEKQ
```

Save and exit: press `Ctrl+O`, `Enter`, then `Ctrl+X`.

---

## 📦 Step 6: Initialize Local Database (Admin & Schemes)

Run the local database initializer to create your admin credentials, site settings, and 4 default chit schemes:
```bash
node /var/www/gpk-chit/server/seed-local-db.mjs
```

You will see:
```text
✓ Successfully connected to MongoDB.
✓ Admin user created: admin@gpkcrackers.com (password: admin321)
✓ Chit application sequence counter initialized to 4 (Next will be GPK-APP-00005).
✓ Default chit schemes verified / seeded.
✓ Default GPK Crackers site settings created.
🎉 Database initialization complete!
```

---

## 🚀 Step 7: Deploy and Start the Application

Run the automated deployment script:
```bash
cd /var/www/gpk-chit
./deploy.sh
```

This will:
1. Build the production React frontend with Vite into `dist/`.
2. Sync `dist/` to `/var/www/gpk-chit/dist/` with proper permissions.
3. Install backend dependencies.
4. Launch/reload the backend under **PM2** on port **`5033`**.
5. Test and reload Nginx.
6. Verify backend health on `http://127.0.0.1:5033/api/chit-schemes`.

Check that PM2 is running:
```bash
pm2 status
```

---

## 🔒 Step 8: Enable Free SSL (HTTPS) with Certbot

Run Certbot to automatically configure SSL for `gpk-chits.gemshine.tech`:
```bash
certbot --nginx -d gpk-chits.gemshine.tech
```

1. Enter your email when prompted.
2. Agree to the terms (`Y`).
3. Certbot will automatically issue the certificate and update Nginx to enforce HTTPS!

---

## 🔍 Useful Maintenance & Monitoring Commands

### PM2 Process Management
```bash
# View live logs of backend
pm2 logs gpk-chit-backend

# Restart backend
pm2 restart gpk-chit-backend

# Stop backend
pm2 stop gpk-chit-backend
```

### Local MongoDB Management
```bash
# Check MongoDB status
systemctl status mongod

# Restart MongoDB
systemctl restart mongod

# Connect to MongoDB shell
mongosh "mongodb://127.0.0.1:27017/gpk_chit"
```

### Nginx Management
```bash
# Test Nginx syntax
nginx -t

# Reload Nginx without downtime
systemctl reload nginx

# View Nginx access & error logs
tail -f /var/log/nginx/gpk-chit-access.log
tail -f /var/log/nginx/gpk-chit-error.log
```

---

## 🔑 Default Credentials

- **Admin Portal**: `https://gpk-chits.gemshine.tech/admin/login`
- **Email**: `admin@gpkcrackers.com`
- **Password**: `admin321`
- **Customer Chit Scheme Portal**: `https://gpk-chits.gemshine.tech/chit-schemes`
