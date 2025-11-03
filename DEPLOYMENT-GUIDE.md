
# 🚀 Deployment Guide for metric-panel.com

## Current Status
✅ **Domain**: metric-panel.com (Cloudflare configured)
✅ **Frontend**: Built and ready
✅ **Backend**: Production configured
✅ **Database**: MongoDB Atlas connected
✅ **Discord**: OAuth2 configured

## Quick Deploy Options

### Option 1: Railway (Recommended)
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project → Deploy with GitHub
4. Connect your repository
5. Railway auto-deploys both frontend and backend
6. Add environment variables in Railway dashboard
7. Copy deployment URL and configure DNS

### Option 2: Render.com
1. Go to https://render.com
2. Create Web Service from GitHub
3. Configure build and start commands
4. Add environment variables
5. Deploy and get URL

### Option 3: DigitalOcean App Platform
1. Go to https://cloud.digitalocean.com/apps
2. Create App from GitHub
3. Configure frontend and backend services
4. Deploy and get URL

## Environment Variables Required:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
JWT_SECRET=milo_super_secure_jwt_secret_key_2024_discord_bot_dashboard_project
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
```

## Cloudflare DNS Configuration:
Once you have your deployment URL, configure DNS:

1. Login to Cloudflare Dashboard
2. Go to DNS settings for metric-panel.com
3. Add A record: @ → [Your server IP]
4. Or add CNAME: @ → [Your deployment domain]
5. Enable proxy (orange cloud)

## Final Steps:
1. Deploy to chosen platform
2. Configure DNS in Cloudflare
3. Test https://metric-panel.com
4. Update Discord redirect URI if needed

Your Milo Discord bot dashboard will be LIVE! 🎉
