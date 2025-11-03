#!/bin/bash

# Let's Encrypt SSL Setup
# Domain: localhost

echo "🔒 Setting up Let's Encrypt SSL for localhost..."

# Install certbot
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Get certificate
sudo certbot --nginx -d localhost --non-interactive --agree-tos --email admin@localhost

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ SSL certificate installed and auto-renewal configured!"
