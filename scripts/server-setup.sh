#!/bin/bash
# =============================================================================
# FPL Companion - One-Time Lightsail/EC2 Server Setup
# Run this script once on a fresh Ubuntu 22.04+ instance
# Usage: curl -sSL <raw-github-url>/scripts/server-setup.sh | bash
# =============================================================================

set -euo pipefail

DOMAIN="fplcompanion.com"
APP_DIR="/opt/fplcompanion"
DEPLOY_USER="deploy"

echo "=== FPL Companion Server Setup ==="

# --- System updates ---
echo "[1/7] Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# --- Install Docker ---
echo "[2/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    echo "Docker installed."
else
    echo "Docker already installed."
fi

# --- Install Docker Compose plugin ---
echo "[3/7] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
    echo "Docker Compose installed."
else
    echo "Docker Compose already installed."
fi

# --- Create deploy user ---
echo "[4/7] Creating deploy user..."
if ! id "$DEPLOY_USER" &> /dev/null; then
    sudo useradd -m -s /bin/bash "$DEPLOY_USER"
    sudo usermod -aG docker "$DEPLOY_USER"
    sudo mkdir -p /home/$DEPLOY_USER/.ssh
    # Copy authorized_keys so the deploy user can be accessed via SSH
    if [ -f /home/ubuntu/.ssh/authorized_keys ]; then
        sudo cp /home/ubuntu/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/
    fi
    sudo chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    sudo chmod 700 /home/$DEPLOY_USER/.ssh
    sudo chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
    echo "Deploy user created."
else
    echo "Deploy user already exists."
fi

# --- Create application directory ---
echo "[5/7] Setting up application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"

# --- Clone repository (or set up for first deploy) ---
echo "[6/7] Preparing deployment directory..."
if [ ! -d "$APP_DIR/.git" ]; then
    echo "Directory ready for first deployment at $APP_DIR"
    echo "The GitHub Actions workflow will clone the repo on first deploy."
else
    echo "Repository already exists at $APP_DIR"
fi

# --- Obtain initial SSL certificate ---
echo "[7/7] Obtaining SSL certificate..."
# Create a temporary nginx config for the ACME challenge
mkdir -p /tmp/certbot-setup
cat > /tmp/certbot-setup/nginx.conf << 'NGINX'
server {
    listen 80;
    server_name fplcompanion.com www.fplcompanion.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'FPL Companion - Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
NGINX

# Start a temporary nginx for certbot verification
sudo mkdir -p /var/www/certbot
docker run -d --name nginx-certbot-setup \
    -p 80:80 \
    -v /tmp/certbot-setup/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
    -v /var/www/certbot:/var/www/certbot \
    nginx:alpine

echo ""
echo "Temporary nginx started for SSL verification."
echo "Make sure DNS for $DOMAIN and www.$DOMAIN points to this server's IP."
echo ""
read -p "Press Enter once DNS is configured and propagated..."

# Run certbot to get the certificate
docker run --rm \
    -v fplcompanion_certbot-etc:/etc/letsencrypt \
    -v /var/www/certbot:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "admin@$DOMAIN" \
    --no-eff-email

# Stop and remove the temporary nginx
docker stop nginx-certbot-setup && docker rm nginx-certbot-setup
rm -rf /tmp/certbot-setup

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Add these GitHub repository secrets:"
echo "     - LIGHTSAIL_HOST       = $(curl -s http://checkip.amazonaws.com)"
echo "     - LIGHTSAIL_SSH_KEY    = <contents of the SSH private key>"
echo "     - LIGHTSAIL_USER       = deploy"
echo "     - GOOGLE_AI_API_KEY    = <your Google AI API key (optional)>"
echo ""
echo "  2. Open firewall ports 80 and 443 in the Lightsail console"
echo ""
echo "  3. Push a release to trigger the deployment workflow"
echo ""
