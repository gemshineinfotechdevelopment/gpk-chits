#!/usr/bin/env bash

# ==============================================================================
# GPK Crackers - One-Time VPS Setup Script (Ubuntu/Debian)
# Domain: gpk-chits.gemshine.tech
# Backend Port: 5033
# Local Database: MongoDB on localhost (127.0.0.1:27017/gpk_chit)
# ==============================================================================
# Usage on VPS (as root):
#   chmod +x setup-vps.sh
#   ./setup-vps.sh
# ==============================================================================

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DOMAIN="gpk-chits.gemshine.tech"
BACKEND_PORT=5033
DEPLOY_DIR="/var/www/gpk-chits"

echo -e "${BLUE}"
echo "========================================================"
echo "    🚀 GPK Crackers - Complete VPS Setup                "
echo "    Domain:  $DOMAIN"
echo "    Port:    $BACKEND_PORT"
echo "    DB:      Local MongoDB (127.0.0.1:27017/gpk_chit)"
echo "========================================================"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script as root!${NC}"
  exit 1
fi

# 1. System Package Updates & Prerequisites
echo -e "${CYAN}[1/8] Updating package lists & installing base tools...${NC}"
apt-get update -y
apt-get install -y curl wget git gnupg ca-certificates lsb-release build-essential ufw nginx certbot python3-certbot-nginx

# 2. Install MongoDB Community Edition Locally on the VPS
echo -e "${CYAN}[2/8] Installing MongoDB Community Edition on VPS...${NC}"
if ! command -v mongod >/dev/null 2>&1; then
  UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
  echo -e "Detected distribution codename: ${YELLOW}$UBUNTU_CODENAME${NC}"

  # Import MongoDB public GPG Key
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg --yes

  # Create MongoDB list file for Ubuntu / Debian
  if [ -f /etc/lsb-release ]; then
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | \
      tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  else
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
      tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  fi

  apt-get update -y
  apt-get install -y mongodb-org || apt-get install -y mongodb
fi

# Start & Enable MongoDB Service
systemctl daemon-reload
systemctl enable mongod || systemctl enable mongodb
systemctl restart mongod || systemctl restart mongodb
sleep 2

if systemctl is-active --quiet mongod || systemctl is-active --quiet mongodb; then
  echo -e "${GREEN}✓ Local MongoDB server is ACTIVE and running on 127.0.0.1:27017${NC}"
else
  echo -e "${YELLOW}[WARN] MongoDB installed but not active. Check systemctl status mongod${NC}"
fi

# 3. Install Node.js 20 LTS (NodeSource)
echo -e "${CYAN}[3/8] Installing Node.js 20 LTS...${NC}"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node -v) & npm $(npm -v) ready.${NC}"

# 4. Install PM2 Globally
echo -e "${CYAN}[4/8] Installing PM2 process manager...${NC}"
npm install -g pm2
pm2 startup systemd -u root --hp /root || true
echo -e "${GREEN}✓ PM2 $(pm2 -v) installed and systemd startup configured.${NC}"

# 5. Prepare Deployment Directories
echo -e "${CYAN}[5/8] Preparing directory structure...${NC}"
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/server/logs"
mkdir -p /var/log/nginx
echo -e "${GREEN}✓ Deployment directories created at $DEPLOY_DIR${NC}"

# 6. Configure UFW Firewall
echo -e "${CYAN}[6/8] Configuring UFW firewall...${NC}"
ufw allow OpenSSH || ufw allow 22/tcp || true
ufw allow 'Nginx Full' || (ufw allow 80/tcp && ufw allow 443/tcp) || true
echo "y" | ufw enable || true
echo -e "${GREEN}✓ Firewall active (SSH 22, HTTP 80, HTTPS 443 allowed)${NC}"

# 7. Configure Nginx for Domain
echo -e "${CYAN}[7/8] Configuring Nginx for $DOMAIN...${NC}"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$CURRENT_DIR/nginx.gpkcrackers.conf" ]; then
  cp "$CURRENT_DIR/nginx.gpkcrackers.conf" "/etc/nginx/sites-available/$DOMAIN.conf"
  ln -sf "/etc/nginx/sites-available/$DOMAIN.conf" "/etc/nginx/sites-enabled/$DOMAIN.conf"
  rm -f /etc/nginx/sites-enabled/default || true
  nginx -t && systemctl reload nginx
  echo -e "${GREEN}✓ Nginx configuration active for $DOMAIN${NC}"
else
  echo -e "${YELLOW}[WARN] nginx.gpkcrackers.conf not found in current directory. Skipping Nginx config copy.${NC}"
fi

# 8. Summary & Next Steps
echo -e "${GREEN}"
echo "========================================================"
echo "    ✨ VPS Environment Setup Complete!                  "
echo "========================================================"
echo -e "${NC}"
echo -e "Summary:"
echo -e "  - Node.js: $(node -v)"
echo -e "  - PM2: v$(pm2 -v)"
echo -e "  - MongoDB: Local on 127.0.0.1:27017"
echo -e "  - Domain: $DOMAIN -> reverse proxy to 127.0.0.1:$BACKEND_PORT"
echo ""
echo -e "Next steps to finish deployment:"
echo -e "  1. If code is in current folder, run:  ${CYAN}./deploy.sh${NC}"
echo -e "  2. Initialize local database with:     ${CYAN}node server/seed-local-db.mjs${NC}"
echo -e "  3. Issue free SSL certificate via:    ${CYAN}certbot --nginx -d $DOMAIN${NC}"
echo ""
