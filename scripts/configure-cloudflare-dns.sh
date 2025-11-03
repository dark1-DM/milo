
#!/bin/bash

# Cloudflare DNS Configuration Script for metric-panel.com
# Zone ID: 7d214bdee36b27de5a16dadbf385fec6
# Domain: metric-panel.com

echo "🌐 Configuring Cloudflare DNS for metric-panel.com..."

# Function to make Cloudflare API calls
cf_api() {
    curl -X $1 "https://api.cloudflare.com/client/v4/$2" \
         -H "Authorization: Bearer HFExnM_D0JgYvI-p4lbic5lp14zCXs6zfn37pXmZ" \
         -H "Content-Type: application/json" \
         $3
}

# Get your server IP (replace with actual IP)
read -p "Enter your server IP address: " SERVER_IP

# Create A record for root domain
echo "📍 Creating A record for metric-panel.com..."
cf_api POST "zones/7d214bdee36b27de5a16dadbf385fec6/dns_records" \
    --data '{
        "type": "A",
        "name": "@",
        "content": "'"$SERVER_IP"'",
        "ttl": 300,
        "proxied": true
    }'

# Create CNAME record for www
echo "📍 Creating CNAME record for www.metric-panel.com..."
cf_api POST "zones/7d214bdee36b27de5a16dadbf385fec6/dns_records" \
    --data '{
        "type": "CNAME",
        "name": "www",
        "content": "metric-panel.com",
        "ttl": 300,
        "proxied": true
    }'

echo "✅ DNS records created successfully!"
echo "🔄 DNS propagation may take up to 24 hours"
echo "🌐 Your site will be available at: https://metric-panel.com"
