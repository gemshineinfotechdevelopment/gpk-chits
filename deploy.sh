#!/usr/bin/env bash

# ==============================================================================
# GPK Crackers - Chit Scheme VPS Deployment Script
# Domain: gpk-chits.gemshine.tech
# Backend Port: 5033
# Local Database: MongoDB on 127.0.0.1:27017/gpk_chit
# ==============================================================================
# Usage on VPS (as root):
#   chmod +x deploy.sh
#   ./deploy.sh
# ==============================================================================

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
  echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}"
echo "========================================================"
echo "    🚀 Starting GPK Crackers VPS Deployment             "
echo "    Target Domain: gpk-chits.gemshine.tech              "
echo "    Backend Port:  5033                                 "
echo "    Local MongoDB: 127.0.0.1:27017/gpk_chit             "
echo "========================================================"
echo -e "${NC}"

# 1. Project Directory Resolution
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
log_info "Working directory: $PROJECT_DIR"

# 2. Git Pull Latest Code (if git repository)
log_info "Checking for latest updates from Git..."
if [ -d ".git" ]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  log_info "Current Git branch: $CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH" || log_warn "git pull skipped or failed, continuing with current files."
  log_success "Git repository checked."
else
  log_warn "Not a git repository or .git folder not found. Skipping git pull."
fi

# 3. Frontend Installation & Build
log_info "Installing frontend dependencies..."
npm install

log_info "Building production frontend (Vite)..."
npm run build
log_success "Frontend built successfully -> dist/ folder updated."

# Ensure Nginx web root /var/www/gpk-chits/dist is up to date
if [ "$PROJECT_DIR" != "/var/www/gpk-chits" ]; then
  mkdir -p /var/www/gpk-chits
  cp -r "$PROJECT_DIR/dist" /var/www/gpk-chits/
  chmod -R 755 /var/www/gpk-chits
  log_success "Synced built dist/ to /var/www/gpk-chits/dist for Nginx."
fi

# 4. Backend Dependencies & Environment Verification
log_info "Installing backend dependencies in server/..."
cd "$PROJECT_DIR/server"
npm install --omit=dev

# Verify server .env exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    log_warn "server/.env not found! Copying from .env.example..."
    cp .env.example .env
  else
    log_error "No .env found in server directory!"
  fi
fi

# Ensure local MongoDB service is running
if command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active --quiet mongod && ! systemctl is-active --quiet mongodb; then
    log_warn "Starting local MongoDB service..."
    systemctl start mongod 2>/dev/null || systemctl start mongodb 2>/dev/null || true
  fi
fi

# Seed or verify local database
if [ -f "$PROJECT_DIR/server/seed-local-db.mjs" ]; then
  log_info "Verifying local database collections & admin user..."
  node "$PROJECT_DIR/server/seed-local-db.mjs" || log_warn "DB seed warning, continuing..."
fi

cd "$PROJECT_DIR"

# 5. Restart Backend Process via PM2 (Port 5033)
log_info "Managing PM2 backend process on port 5033..."
APP_NAME="gpk-chits-backend"

if command -v pm2 >/dev/null 2>&1; then
  if [ -f "$PROJECT_DIR/ecosystem.config.cjs" ]; then
    log_info "Reloading PM2 via ecosystem.config.cjs..."
    pm2 reload "$PROJECT_DIR/ecosystem.config.cjs" --env production || pm2 start "$PROJECT_DIR/ecosystem.config.cjs" --env production
  else
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
      log_info "Restarting PM2 process '$APP_NAME'..."
      pm2 restart "$APP_NAME" --update-env
    else
      log_info "Starting new PM2 process '$APP_NAME'..."
      PORT=5033 pm2 start server.js --name "$APP_NAME" --time
    fi
  fi
  pm2 save || true
  log_success "PM2 backend process is active."
else
  log_warn "PM2 is not installed globally. Starting using npx pm2..."
  npx pm2 reload "$APP_NAME" 2>/dev/null || npx pm2 start server.js --name "$APP_NAME" || true
fi

cd "$PROJECT_DIR"

# 6. Nginx Reload
if command -v nginx >/dev/null 2>&1; then
  log_info "Testing and reloading Nginx..."
  if nginx -t 2>/dev/null; then
    systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
    log_success "Nginx reloaded successfully."
  else
    log_warn "Nginx configuration test failed. Please verify with 'nginx -t'."
  fi
fi

# 7. Health Check on Port 5033
log_info "Performing health check on port 5033..."
sleep 2
PORT=${PORT:-5033}
if command -v curl >/dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/chit-schemes" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    log_success "Backend health check passed! (HTTP 200 on port $PORT)"
  else
    log_warn "Backend returned HTTP $HTTP_CODE. Check logs with 'pm2 logs $APP_NAME'."
  fi
fi

echo -e "${GREEN}"
echo "========================================================"
echo "    ✨ GPK Crackers Deployment Completed!               "
echo "    Domain: https://gpk-chits.gemshine.tech             "
echo "    Local Port: 5033                                    "
echo "========================================================"
echo -e "${NC}"
