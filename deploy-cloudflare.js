#!/usr/bin/env node

/**
 * 🚀 Cloudflare Deployment Script for Milo Discord Bot Dashboard
 * Domain: metric-panel.com
 * Author: Milo Development Team
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CloudflareDeployment {
    constructor() {
        this.domain = 'metric-panel.com';
        this.cloudflareConfig = {
            zoneId: '7d214bdee36b27de5a16dadbf385fec6',
            accountId: '86d1db260ccffef0e4ec59733b484ec8',
            apiToken: 'HFExnM_D0JgYvI-p4lbic5lp14zCXs6zfn37pXmZ'
        };
    }

    async deploy() {
        console.log('🚀 Starting Cloudflare Deployment for metric-panel.com\n');
        
        try {
            // Step 1: Build the application
            await this.buildApplication();
            
            // Step 2: Deploy to hosting platform
            await this.selectHostingPlatform();
            
            // Step 3: Configure Cloudflare DNS
            await this.configureCloudflareSettings();
            
            console.log('\n✅ Deployment completed successfully!');
            console.log(`🌐 Your application will be available at: https://${this.domain}`);
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    async buildApplication() {
        console.log('📦 Building application...\n');
        
        // Build frontend
        console.log('🔨 Building frontend...');
        process.chdir('./frontend');
        execSync('npm run build', { stdio: 'inherit' });
        process.chdir('..');
        
        // Prepare backend
        console.log('🔧 Preparing backend...');
        execSync('npm install --production', { stdio: 'inherit', cwd: './backend' });
        
        console.log('✅ Application built successfully!\n');
    }

    async selectHostingPlatform() {
        console.log('🏗️ Choose your hosting platform:\n');
        console.log('1. Vercel (Recommended for React)');
        console.log('2. Netlify (Easy setup)');
        console.log('3. DigitalOcean App Platform');
        console.log('4. Railway');
        console.log('5. Render');
        console.log('6. Manual VPS setup');
        
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            readline.question('\nSelect hosting platform (1-6): ', (answer) => {
                readline.close();
                
                switch(answer.trim()) {
                    case '1':
                        this.deployToVercel();
                        break;
                    case '2':
                        this.deployToNetlify();
                        break;
                    case '3':
                        this.deployToDigitalOcean();
                        break;
                    case '4':
                        this.deployToRailway();
                        break;
                    case '5':
                        this.deployToRender();
                        break;
                    case '6':
                        this.setupManualVPS();
                        break;
                    default:
                        console.log('⚡ Defaulting to Vercel...');
                        this.deployToVercel();
                }
                resolve();
            });
        });
    }

    deployToVercel() {
        console.log('\n🚀 Setting up Vercel deployment...\n');
        
        // Create vercel.json
        const vercelConfig = {
            "version": 2,
            "builds": [
                {
                    "src": "frontend/build/**",
                    "use": "@vercel/static"
                },
                {
                    "src": "backend/index.js",
                    "use": "@vercel/node"
                }
            ],
            "routes": [
                {
                    "src": "/api/(.*)",
                    "dest": "/backend/index.js"
                },
                {
                    "src": "/(.*)",
                    "dest": "/frontend/build/$1"
                }
            ],
            "env": {
                "NODE_ENV": "production",
                "MONGODB_URI": process.env.MONGODB_URI,
                "DISCORD_TOKEN": process.env.DISCORD_TOKEN,
                "DISCORD_CLIENT_ID": process.env.DISCORD_CLIENT_ID,
                "DISCORD_CLIENT_SECRET": process.env.DISCORD_CLIENT_SECRET,
                "JWT_SECRET": process.env.JWT_SECRET,
                "CLOUDFLARE_API_TOKEN": this.cloudflareConfig.apiToken,
                "CLOUDFLARE_ZONE_ID": this.cloudflareConfig.zoneId
            }
        };
        
        fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
        
        console.log('📋 Vercel configuration created!');
        console.log('\n📝 Next steps:');
        console.log('1. Install Vercel CLI: npm i -g vercel');
        console.log('2. Login to Vercel: vercel login');
        console.log('3. Deploy: vercel --prod');
        console.log('4. Copy the deployment URL for DNS configuration');
    }

    deployToNetlify() {
        console.log('\n🚀 Setting up Netlify deployment...\n');
        
        // Create netlify.toml
        const netlifyConfig = `
[build]
  publish = "frontend/build"
  command = "npm run build:frontend"

[build.environment]
  NODE_ENV = "production"
  REACT_APP_API_URL = "https://metric-panel.com/api"
  REACT_APP_WEBSOCKET_URL = "wss://metric-panel.com"
  REACT_APP_FRONTEND_URL = "https://metric-panel.com"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
        
        fs.writeFileSync('netlify.toml', netlifyConfig);
        
        console.log('📋 Netlify configuration created!');
        console.log('\n📝 Next steps:');
        console.log('1. Connect your GitHub repository to Netlify');
        console.log('2. Set up environment variables in Netlify dashboard');
        console.log('3. Deploy and get your Netlify URL');
        console.log('4. Configure DNS to point to Netlify');
    }

    deployToDigitalOcean() {
        console.log('\n🚀 Setting up DigitalOcean App Platform deployment...\n');
        
        const appSpec = {
            "name": "milo-discord-dashboard",
            "services": [
                {
                    "name": "backend",
                    "source_dir": "/backend",
                    "github": {
                        "repo": "your-username/discord-bot-dashboard",
                        "branch": "main"
                    },
                    "run_command": "node index.js",
                    "environment_slug": "node-js",
                    "instance_count": 1,
                    "instance_size_slug": "basic-xxs",
                    "envs": [
                        {
                            "key": "NODE_ENV",
                            "value": "production"
                        },
                        {
                            "key": "MONGODB_URI",
                            "value": "${MONGODB_URI}"
                        }
                    ]
                }
            ],
            "static_sites": [
                {
                    "name": "frontend",
                    "source_dir": "/frontend",
                    "github": {
                        "repo": "your-username/discord-bot-dashboard",
                        "branch": "main"
                    },
                    "build_command": "npm run build",
                    "output_dir": "/build"
                }
            ]
        };
        
        fs.writeFileSync('.do/app.yaml', JSON.stringify(appSpec, null, 2));
        
        console.log('📋 DigitalOcean App Platform configuration created!');
    }

    async configureCloudflareSettings() {
        console.log('\n🌐 Configuring Cloudflare settings...\n');
        
        console.log('📝 Cloudflare Configuration Steps:');
        console.log('1. 🔗 DNS Records:');
        console.log('   - Add A record: @ → Your server IP');
        console.log('   - Add CNAME record: www → metric-panel.com');
        console.log('');
        console.log('2. 🔒 SSL/TLS Settings:');
        console.log('   - Set SSL mode to "Full (Strict)"');
        console.log('   - Enable "Always Use HTTPS"');
        console.log('');
        console.log('3. ⚡ Performance Settings:');
        console.log('   - Enable Auto Minify (CSS, HTML, JS)');
        console.log('   - Set Browser Cache TTL to "4 hours"');
        console.log('   - Enable Brotli compression');
        console.log('');
        console.log('4. 🛡️ Security Settings:');
        console.log('   - Set Security Level to "Medium"');
        console.log('   - Enable "Browser Integrity Check"');
        console.log('   - Configure WAF rules if needed');
        
        // Create Cloudflare configuration script
        this.createCloudflareScript();
    }

    createCloudflareScript() {
        const cloudflareScript = `
#!/bin/bash

# Cloudflare DNS Configuration Script for metric-panel.com
# Zone ID: ${this.cloudflareConfig.zoneId}
# Domain: ${this.domain}

echo "🌐 Configuring Cloudflare DNS for ${this.domain}..."

# Function to make Cloudflare API calls
cf_api() {
    curl -X \$1 "https://api.cloudflare.com/client/v4/\$2" \\
         -H "Authorization: Bearer ${this.cloudflareConfig.apiToken}" \\
         -H "Content-Type: application/json" \\
         \$3
}

# Get your server IP (replace with actual IP)
read -p "Enter your server IP address: " SERVER_IP

# Create A record for root domain
echo "📍 Creating A record for ${this.domain}..."
cf_api POST "zones/${this.cloudflareConfig.zoneId}/dns_records" \\
    --data '{
        "type": "A",
        "name": "@",
        "content": "'"\$SERVER_IP"'",
        "ttl": 300,
        "proxied": true
    }'

# Create CNAME record for www
echo "📍 Creating CNAME record for www.${this.domain}..."
cf_api POST "zones/${this.cloudflareConfig.zoneId}/dns_records" \\
    --data '{
        "type": "CNAME",
        "name": "www",
        "content": "${this.domain}",
        "ttl": 300,
        "proxied": true
    }'

echo "✅ DNS records created successfully!"
echo "🔄 DNS propagation may take up to 24 hours"
echo "🌐 Your site will be available at: https://${this.domain}"
`;
        
        fs.writeFileSync('scripts/configure-cloudflare-dns.sh', cloudflareScript);
        console.log('✅ Cloudflare DNS configuration script created!');
    }
}

// Run deployment
const deployment = new CloudflareDeployment();
deployment.deploy().catch(console.error);