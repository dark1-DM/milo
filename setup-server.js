#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class ServerSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.config = {
            deployment: '',
            database: '',
            domain: '',
            ssl: false,
            monitoring: false,
            analytics: false,
            payment: '',
            email: '',
            discord: {
                token: '',
                clientId: '',
                clientSecret: ''
            },
            environment: 'development'
        };
    }

    async start() {
        console.log('\n🚀 Milo - Server Setup Wizard');
        console.log('===================================================\n');
        
        await this.askDeploymentType();
        await this.askDatabaseConfig();
        await this.askDomainConfig();
        await this.askSSLConfig();
        await this.askMonitoringConfig();
        await this.askPaymentConfig();
        await this.askEmailConfig();
        await this.askDiscordConfig();
        await this.askEnvironment();
        
        await this.generateConfigurations();
        await this.setupDeployment();
        
        console.log('\n✅ Server setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Review the generated configuration files');
        console.log('2. Run the deployment script for your chosen platform');
        console.log('3. Configure your domain and SSL certificates');
        console.log('4. Test your application');
        
        this.rl.close();
    }

    async askDeploymentType() {
        console.log('🔧 Deployment Configuration');
        console.log('----------------------------');
        console.log('1. Docker Compose (Recommended)');
        console.log('2. Traditional Server (PM2)');
        console.log('3. Cloud Platform (AWS/GCP/Azure)');
        console.log('4. Heroku');
        console.log('5. DigitalOcean Droplet');
        console.log('6. Kubernetes');
        console.log('7. Netlify + Backend hosting');
        
        const choice = await this.question('\nSelect deployment type (1-7): ');
        const deploymentTypes = {
            '1': 'docker',
            '2': 'pm2',
            '3': 'cloud',
            '4': 'heroku',
            '5': 'digitalocean',
            '6': 'kubernetes',
            '7': 'netlify'
        };
        
        this.config.deployment = deploymentTypes[choice] || 'docker';
        console.log(`✅ Selected: ${this.config.deployment.toUpperCase()}\n`);
    }

    async askDatabaseConfig() {
        console.log('💾 Database Configuration');
        console.log('-------------------------');
        console.log('1. MongoDB Atlas (Cloud)');
        console.log('2. Local MongoDB');
        console.log('3. Docker MongoDB');
        console.log('4. PostgreSQL');
        console.log('5. MySQL');
        
        const choice = await this.question('\nSelect database type (1-5): ');
        const dbTypes = {
            '1': 'mongodb-atlas',
            '2': 'mongodb-local',
            '3': 'mongodb-docker',
            '4': 'postgresql',
            '5': 'mysql'
        };
        
        this.config.database = dbTypes[choice] || 'mongodb-atlas';
        console.log(`✅ Selected: ${this.config.database.toUpperCase()}\n`);
    }

    async askDomainConfig() {
        console.log('🌐 Domain Configuration');
        console.log('-----------------------');
        
        const hasDomain = await this.question('Do you have a custom domain? (y/n): ');
        if (hasDomain.toLowerCase() === 'y') {
            this.config.domain = await this.question('Enter your domain (e.g., mydashboard.com): ');
        } else {
            this.config.domain = 'localhost';
        }
        
        console.log(`✅ Domain: ${this.config.domain}\n`);
    }

    async askSSLConfig() {
        console.log('🔒 SSL/HTTPS Configuration');
        console.log('--------------------------');
        console.log('1. Let\'s Encrypt (Free, Automatic)');
        console.log('2. Custom SSL Certificate');
        console.log('3. Cloudflare SSL');
        console.log('4. No SSL (HTTP only)');
        
        const choice = await this.question('\nSelect SSL option (1-4): ');
        this.config.ssl = choice !== '4';
        this.config.sslType = {
            '1': 'letsencrypt',
            '2': 'custom',
            '3': 'cloudflare',
            '4': 'none'
        }[choice] || 'letsencrypt';
        
        console.log(`✅ SSL: ${this.config.sslType.toUpperCase()}\n`);
    }

    async askMonitoringConfig() {
        console.log('📊 Monitoring & Analytics');
        console.log('-------------------------');
        console.log('1. Full monitoring (Prometheus + Grafana)');
        console.log('2. Basic logging only');
        console.log('3. Cloud monitoring (AWS CloudWatch, etc.)');
        console.log('4. No monitoring');
        
        const choice = await this.question('\nSelect monitoring level (1-4): ');
        this.config.monitoring = {
            '1': 'full',
            '2': 'basic',
            '3': 'cloud',
            '4': 'none'
        }[choice] || 'basic';
        
        console.log(`✅ Monitoring: ${this.config.monitoring.toUpperCase()}\n`);
    }

    async askPaymentConfig() {
        console.log('💳 Payment Integration');
        console.log('----------------------');
        console.log('1. Stripe');
        console.log('2. PayPal');
        console.log('3. Both Stripe & PayPal');
        console.log('4. No payment processing');
        
        const choice = await this.question('\nSelect payment option (1-4): ');
        this.config.payment = {
            '1': 'stripe',
            '2': 'paypal',
            '3': 'both',
            '4': 'none'
        }[choice] || 'none';
        
        console.log(`✅ Payment: ${this.config.payment.toUpperCase()}\n`);
    }

    async askEmailConfig() {
        console.log('📧 Email Service');
        console.log('----------------');
        console.log('1. Gmail SMTP');
        console.log('2. SendGrid');
        console.log('3. AWS SES');
        console.log('4. Mailgun');
        console.log('5. No email service');
        
        const choice = await this.question('\nSelect email service (1-5): ');
        this.config.email = {
            '1': 'gmail',
            '2': 'sendgrid',
            '3': 'aws-ses',
            '4': 'mailgun',
            '5': 'none'
        }[choice] || 'none';
        
        console.log(`✅ Email: ${this.config.email.toUpperCase()}\n`);
    }

    async askDiscordConfig() {
        console.log('🤖 Discord Bot Configuration');
        console.log('-----------------------------');
        
        const hasBot = await this.question('Do you have Discord bot credentials? (y/n): ');
        if (hasBot.toLowerCase() === 'y') {
            this.config.discord.token = await this.question('Discord Bot Token: ', true);
            this.config.discord.clientId = await this.question('Discord Client ID: ');
            this.config.discord.clientSecret = await this.question('Discord Client Secret: ', true);
        }
        
        console.log('✅ Discord configuration saved\n');
    }

    async askEnvironment() {
        console.log('🏗️  Environment Setup');
        console.log('---------------------');
        console.log('1. Development');
        console.log('2. Staging');
        console.log('3. Production');
        
        const choice = await this.question('\nSelect environment (1-3): ');
        this.config.environment = {
            '1': 'development',
            '2': 'staging',
            '3': 'production'
        }[choice] || 'development';
        
        console.log(`✅ Environment: ${this.config.environment.toUpperCase()}\n`);
    }

    async generateConfigurations() {
        console.log('📝 Generating configuration files...\n');
        
        // Generate environment files
        await this.generateEnvironmentFiles();
        
        // Generate deployment files
        await this.generateDeploymentFiles();
        
        // Generate nginx config
        await this.generateNginxConfig();
        
        // Generate docker configs
        await this.generateDockerConfigs();
        
        // Generate monitoring configs
        if (this.config.monitoring !== 'none') {
            await this.generateMonitoringConfigs();
        }
        
        // Generate SSL configs
        if (this.config.ssl) {
            await this.generateSSLConfigs();
        }
        
        console.log('✅ All configuration files generated!\n');
    }

    async generateEnvironmentFiles() {
        const backendEnv = this.generateBackendEnv();
        const frontendEnv = this.generateFrontendEnv();
        
        fs.writeFileSync(path.join(__dirname, 'backend', '.env'), backendEnv);
        fs.writeFileSync(path.join(__dirname, 'frontend', '.env'), frontendEnv);
        
        if (this.config.environment === 'production') {
            fs.writeFileSync(path.join(__dirname, 'backend', '.env.production'), backendEnv);
            fs.writeFileSync(path.join(__dirname, 'frontend', '.env.production'), frontendEnv);
        }
        
        console.log('✅ Environment files generated');
    }

    generateBackendEnv() {
        const protocol = this.config.ssl ? 'https' : 'http';
        const domain = this.config.domain === 'localhost' ? 'localhost:8000' : this.config.domain;
        
        return `# Backend Environment Configuration
# Generated by Milo Setup Wizard
# Date: ${new Date().toISOString()}

# Server Configuration
NODE_ENV=${this.config.environment}
PORT=8000
SERVER_URL=${protocol}://${domain}

# Database Configuration
${this.generateDatabaseEnv()}

# Discord Bot Configuration
DISCORD_TOKEN=${this.config.discord.token || 'your_bot_token_here'}
DISCORD_CLIENT_ID=${this.config.discord.clientId || 'your_client_id_here'}
DISCORD_CLIENT_SECRET=${this.config.discord.clientSecret || 'your_client_secret_here'}

# JWT & Authentication
JWT_SECRET=${this.generateRandomSecret(64)}
SESSION_SECRET=${this.generateRandomSecret(64)}

# CORS Configuration
ALLOWED_ORIGINS=${protocol}://${this.config.domain === 'localhost' ? 'localhost:3000' : this.config.domain}

# Payment Configuration
${this.generatePaymentEnv()}

# Email Configuration
${this.generateEmailEnv()}

# OAuth Configuration
DISCORD_REDIRECT_URI=${protocol}://${domain}/auth/discord/callback

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
${this.generateMonitoringEnv()}

# Features
ENABLE_ANALYTICS=true
ENABLE_REAL_TIME=true
ENABLE_FILE_UPLOAD=true
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=${this.config.environment === 'production' ? 'info' : 'debug'}
LOG_FILE=logs/app.log
`;
    }

    generateFrontendEnv() {
        const protocol = this.config.ssl ? 'https' : 'http';
        const backendUrl = this.config.domain === 'localhost' ? 'http://localhost:8000' : `${protocol}://${this.config.domain}`;
        
        return `# Frontend Environment Configuration
# Generated by Milo Setup Wizard
# Date: ${new Date().toISOString()}

# API Configuration
REACT_APP_API_URL=${backendUrl}
REACT_APP_WS_URL=${backendUrl}

# App Configuration
REACT_APP_NAME=Milo
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=${this.config.environment}

# Features
REACT_APP_ENABLE_ANALYTICS=${this.config.monitoring !== 'none'}
REACT_APP_ENABLE_PAYMENTS=${this.config.payment !== 'none'}
REACT_APP_ENABLE_REAL_TIME=true

# Discord Configuration
REACT_APP_DISCORD_CLIENT_ID=${this.config.discord.clientId || 'your_client_id_here'}

# Payment Configuration
${this.generateFrontendPaymentEnv()}

# Analytics
${this.generateFrontendAnalyticsEnv()}

# Build Configuration
GENERATE_SOURCEMAP=${this.config.environment !== 'production'}
REACT_APP_BUILD_DATE=${new Date().toISOString()}
`;
    }

    generateDatabaseEnv() {
        switch (this.config.database) {
            case 'mongodb-atlas':
                return `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/discord-bot-dashboard?retryWrites=true&w=majority`;
            case 'mongodb-local':
                return `MONGODB_URI=mongodb://localhost:27017/discord-bot-dashboard`;
            case 'mongodb-docker':
                return `MONGODB_URI=mongodb://mongo:27017/discord-bot-dashboard`;
            case 'postgresql':
                return `DATABASE_URL=postgresql://username:password@localhost:5432/discord_bot_dashboard`;
            case 'mysql':
                return `DATABASE_URL=mysql://username:password@localhost:3306/discord_bot_dashboard`;
            default:
                return `MONGODB_URI=mongodb://localhost:27017/discord-bot-dashboard`;
        }
    }

    generatePaymentEnv() {
        let env = '';
        if (this.config.payment === 'stripe' || this.config.payment === 'both') {
            env += `# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
`;
        }
        if (this.config.payment === 'paypal' || this.config.payment === 'both') {
            env += `# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
`;
        }
        return env || '# No payment processing configured';
    }

    generateEmailEnv() {
        switch (this.config.email) {
            case 'gmail':
                return `# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password`;
            case 'sendgrid':
                return `# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key`;
            case 'aws-ses':
                return `# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587`;
            case 'mailgun':
                return `# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587`;
            default:
                return '# No email service configured';
        }
    }

    generateMonitoringEnv() {
        if (this.config.monitoring === 'none') return '# No monitoring configured';
        
        return `# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
PROMETHEUS_ENABLED=${this.config.monitoring === 'full'}
GRAFANA_ENABLED=${this.config.monitoring === 'full'}
`;
    }

    generateFrontendPaymentEnv() {
        if (this.config.payment === 'stripe' || this.config.payment === 'both') {
            return `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key`;
        }
        if (this.config.payment === 'paypal' || this.config.payment === 'both') {
            return `REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id`;
        }
        return '# No payment processing configured';
    }

    generateFrontendAnalyticsEnv() {
        if (this.config.monitoring !== 'none') {
            return `REACT_APP_ANALYTICS_ENABLED=true
REACT_APP_GOOGLE_ANALYTICS_ID=your_ga_id_here`;
        }
        return 'REACT_APP_ANALYTICS_ENABLED=false';
    }

    async generateDeploymentFiles() {
        switch (this.config.deployment) {
            case 'docker':
                await this.generateDockerDeployment();
                break;
            case 'pm2':
                await this.generatePM2Deployment();
                break;
            case 'kubernetes':
                await this.generateKubernetesDeployment();
                break;
            case 'heroku':
                await this.generateHerokuDeployment();
                break;
            case 'digitalocean':
                await this.generateDigitalOceanDeployment();
                break;
            case 'netlify':
                await this.generateNetlifyDeployment();
                break;
            default:
                await this.generateDockerDeployment();
        }
        
        console.log('✅ Deployment files generated');
    }

    async generateDockerDeployment() {
        const dockerCompose = `version: '3.8'

services:
  # Backend API Server
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=${this.config.environment}
    env_file:
      - ./backend/.env
    depends_on:
      ${this.config.database.includes('mongodb') ? '- mongo' : ''}
      ${this.config.database === 'postgresql' ? '- postgres' : ''}
      ${this.config.database === 'mysql' ? '- mysql' : ''}
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  # Frontend React App
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${this.config.environment}
    env_file:
      - ./frontend/.env
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      ${this.config.ssl ? '- "443:443"' : ''}
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites:/etc/nginx/sites-available
      ${this.config.ssl ? '- ./ssl:/etc/nginx/ssl' : ''}
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

${this.generateDatabaseService()}

${this.config.monitoring === 'full' ? this.generateMonitoringServices() : ''}

volumes:
  ${this.config.database.includes('mongodb') ? 'mongo_data:' : ''}
  ${this.config.database === 'postgresql' ? 'postgres_data:' : ''}
  ${this.config.database === 'mysql' ? 'mysql_data:' : ''}
  ${this.config.monitoring === 'full' ? 'prometheus_data:\n  grafana_data:' : ''}
`;

        fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
        
        // Generate deployment scripts
        const deployScript = this.generateDockerDeployScript();
        fs.writeFileSync(path.join(__dirname, 'deploy.sh'), deployScript);
        fs.chmodSync(path.join(__dirname, 'deploy.sh'), '755');
    }

    generateDatabaseService() {
        switch (this.config.database) {
            case 'mongodb-docker':
                return `  # MongoDB Database
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: discord-bot-dashboard
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped`;
                
            case 'postgresql':
                return `  # PostgreSQL Database
  postgres:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: discord_bot_dashboard
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped`;
                
            case 'mysql':
                return `  # MySQL Database
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: discord_bot_dashboard
      MYSQL_USER: admin
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped`;
                
            default:
                return '';
        }
    }

    generateMonitoringServices() {
        return `  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  # Grafana Dashboard
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    restart: unless-stopped`;
    }

    generateDockerDeployScript() {
        return `#!/bin/bash

# Milo - Docker Deployment Script
# Generated: ${new Date().toISOString()}

echo "🚀 Starting Milo deployment..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose pull

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=50

echo "✅ Deployment completed!"
echo ""
echo "🌐 Frontend: http://${this.config.domain === 'localhost' ? 'localhost:3000' : this.config.domain}"
echo "🔧 Backend API: http://${this.config.domain === 'localhost' ? 'localhost:8000' : this.config.domain}:8000"
${this.config.monitoring === 'full' ? 'echo "📊 Grafana: http://' + (this.config.domain === 'localhost' ? 'localhost:3001' : this.config.domain) + ':3001"' : ''}
echo ""
echo "📚 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
`;
    }

    async generatePM2Deployment() {
        const ecosystem = {
            apps: [
                {
                    name: 'discord-bot-backend',
                    script: './backend/index.js',
                    cwd: __dirname,
                    instances: this.config.environment === 'production' ? 'max' : 1,
                    exec_mode: 'cluster',
                    env: {
                        NODE_ENV: 'development',
                        PORT: 8000
                    },
                    env_production: {
                        NODE_ENV: 'production',
                        PORT: 8000
                    },
                    log_file: './logs/backend.log',
                    error_file: './logs/backend-error.log',
                    out_file: './logs/backend-out.log',
                    time: true,
                    watch: this.config.environment === 'development',
                    ignore_watch: ['node_modules', 'logs', 'uploads']
                },
                {
                    name: 'discord-bot-frontend',
                    script: 'serve',
                    args: '-s build -l 3000',
                    cwd: path.join(__dirname, 'frontend'),
                    instances: 1,
                    exec_mode: 'fork',
                    env: {
                        NODE_ENV: 'production'
                    },
                    log_file: './logs/frontend.log',
                    error_file: './logs/frontend-error.log',
                    out_file: './logs/frontend-out.log',
                    time: true
                }
            ]
        };

        fs.writeFileSync(path.join(__dirname, 'ecosystem.config.js'), 
            `module.exports = ${JSON.stringify(ecosystem, null, 2)};`);

        // Generate PM2 deployment script
        const deployScript = `#!/bin/bash

# Milo - PM2 Deployment Script
# Generated: ${new Date().toISOString()}

echo "🚀 Starting Milo deployment with PM2..."

# Stop existing processes
echo "🛑 Stopping existing processes..."
pm2 stop ecosystem.config.js || true
pm2 delete ecosystem.config.js || true

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install --production
cd ..

echo "📦 Building frontend..."
cd frontend && npm install && npm run build
cd ..

# Create logs directory
mkdir -p logs

# Start with PM2
echo "▶️  Starting applications with PM2..."
pm2 start ecosystem.config.js --env ${this.config.environment}

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Deployment completed!"
echo ""
echo "🌐 Frontend: http://${this.config.domain === 'localhost' ? 'localhost:3000' : this.config.domain}"
echo "🔧 Backend API: http://${this.config.domain === 'localhost' ? 'localhost:8000' : this.config.domain}:8000"
echo ""
echo "📚 PM2 Commands:"
echo "  pm2 status - View running processes"
echo "  pm2 logs - View logs"
echo "  pm2 restart ecosystem.config.js - Restart all"
echo "  pm2 stop ecosystem.config.js - Stop all"
`;

        fs.writeFileSync(path.join(__dirname, 'deploy-pm2.sh'), deployScript);
        fs.chmodSync(path.join(__dirname, 'deploy-pm2.sh'), '755');
    }

    async generateNginxConfig() {
        const nginxConfig = `events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Main server configuration
    server {
        listen 80;
        server_name ${this.config.domain};
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        
        ${this.config.ssl ? `
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name ${this.config.domain};
        
        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        ` : ''}
        
        # Frontend (React app)
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Increase timeout for long operations
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static files caching
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend:3000;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }
}`;

        // Create nginx directory
        const nginxDir = path.join(__dirname, 'nginx');
        if (!fs.existsSync(nginxDir)) {
            fs.mkdirSync(nginxDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(nginxDir, 'nginx.conf'), nginxConfig);
        console.log('✅ Nginx configuration generated');
    }

    async generateDockerConfigs() {
        // Update backend Dockerfile if needed
        const backendDockerfile = `FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs uploads

# Set permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8000/api/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["node", "index.js"]`;

        fs.writeFileSync(path.join(__dirname, 'backend', 'Dockerfile'), backendDockerfile);
        
        // Update frontend Dockerfile
        const frontendDockerfile = `# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]`;

        fs.writeFileSync(path.join(__dirname, 'frontend', 'Dockerfile'), frontendDockerfile);
        
        console.log('✅ Docker configurations updated');
    }

    async generateMonitoringConfigs() {
        if (this.config.monitoring === 'none') return;
        
        const monitoringDir = path.join(__dirname, 'monitoring');
        if (!fs.existsSync(monitoringDir)) {
            fs.mkdirSync(monitoringDir, { recursive: true });
        }
        
        // Prometheus configuration
        const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'discord-bot-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'discord-bot-frontend'
    static_configs:
      - targets: ['frontend:3000']
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    scrape_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093
`;

        fs.writeFileSync(path.join(monitoringDir, 'prometheus.yml'), prometheusConfig);
        
        // Grafana dashboards directory
        const grafanaDir = path.join(monitoringDir, 'grafana', 'dashboards');
        if (!fs.existsSync(grafanaDir)) {
            fs.mkdirSync(grafanaDir, { recursive: true });
        }
        
        console.log('✅ Monitoring configurations generated');
    }

    async generateSSLConfigs() {
        if (!this.config.ssl) return;
        
        const sslDir = path.join(__dirname, 'ssl');
        if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true });
        }
        
        // Generate SSL setup script
        let sslScript = '';
        
        if (this.config.sslType === 'letsencrypt') {
            sslScript = `#!/bin/bash

# Let's Encrypt SSL Setup
# Domain: ${this.config.domain}

echo "🔒 Setting up Let's Encrypt SSL for ${this.config.domain}..."

# Install certbot
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Get certificate
sudo certbot --nginx -d ${this.config.domain} --non-interactive --agree-tos --email admin@${this.config.domain}

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ SSL certificate installed and auto-renewal configured!"
`;
        } else if (this.config.sslType === 'custom') {
            sslScript = `#!/bin/bash

# Custom SSL Certificate Setup
# Place your certificate files in the ssl/ directory:
# - cert.pem (your certificate)
# - key.pem (your private key)
# - chain.pem (certificate chain, optional)

echo "🔒 Custom SSL setup for ${this.config.domain}"
echo "Please place your SSL certificate files in the ssl/ directory:"
echo "  - ssl/cert.pem"
echo "  - ssl/key.pem" 
echo "  - ssl/chain.pem (optional)"
echo ""
echo "After placing the files, restart your containers:"
echo "  docker-compose restart nginx"
`;
        }
        
        fs.writeFileSync(path.join(__dirname, 'setup-ssl.sh'), sslScript);
        fs.chmodSync(path.join(__dirname, 'setup-ssl.sh'), '755');
        
        console.log('✅ SSL configuration generated');
    }

    async setupDeployment() {
        console.log('🔧 Setting up deployment scripts...\n');
        
        // Generate main deployment script
        const mainDeployScript = `#!/bin/bash

# Milo - Main Deployment Script
# Generated: ${new Date().toISOString()}
# Deployment Type: ${this.config.deployment.toUpperCase()}

echo "🚀 Milo Deployment"
echo "======================================="
echo "Deployment Type: ${this.config.deployment.toUpperCase()}"
echo "Environment: ${this.config.environment.toUpperCase()}"
echo "Domain: ${this.config.domain}"
echo ""

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file missing!"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ Frontend .env file missing!"
    exit 1
fi

echo "✅ Configuration files found"

# Check dependencies
echo "📦 Checking dependencies..."

${this.config.deployment === 'docker' ? `
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found! Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found! Please install Docker Compose first."
    exit 1
fi
` : ''}

${this.config.deployment === 'pm2' ? `
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found! Installing PM2..."
    npm install -g pm2
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js first."
    exit 1
fi
` : ''}

echo "✅ Dependencies check passed"

# Run deployment
echo "🚀 Starting deployment..."

${this.config.deployment === 'docker' ? './deploy.sh' : ''}
${this.config.deployment === 'pm2' ? './deploy-pm2.sh' : ''}

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your domain DNS to point to this server"
${this.config.ssl ? 'echo "2. Run ./setup-ssl.sh to configure SSL certificates"' : ''}
echo "${this.config.ssl ? '3' : '2'}. Update your Discord bot settings with the new domain"
echo "${this.config.ssl ? '4' : '3'}. Test your application thoroughly"
echo ""
echo "🌐 Application URLs:"
echo "Frontend: http${this.config.ssl ? 's' : ''}://${this.config.domain}"
echo "Backend API: http${this.config.ssl ? 's' : ''}://${this.config.domain}/api"
${this.config.monitoring === 'full' ? 'echo "Monitoring: http' + (this.config.ssl ? 's' : '') + '://' + this.config.domain + ':3001"' : ''}
`;

        fs.writeFileSync(path.join(__dirname, 'deploy-main.sh'), mainDeployScript);
        fs.chmodSync(path.join(__dirname, 'deploy-main.sh'), '755');
        
        // Generate README with deployment instructions
        await this.generateDeploymentReadme();
        
        console.log('✅ Deployment setup completed');
    }

    async generateDeploymentReadme() {
        const readme = `# Milo - Deployment Guide

**Generated:** ${new Date().toISOString()}  
**Configuration:** ${this.config.deployment.toUpperCase()} deployment  
**Environment:** ${this.config.environment.toUpperCase()}  
**Domain:** ${this.config.domain}

## 🚀 Quick Start

\`\`\`bash
# Run the main deployment script
./deploy-main.sh
\`\`\`

## 📋 Configuration Summary

- **Deployment Type:** ${this.config.deployment.toUpperCase()}
- **Database:** ${this.config.database.toUpperCase()}
- **SSL/HTTPS:** ${this.config.ssl ? 'Enabled (' + this.config.sslType + ')' : 'Disabled'}
- **Monitoring:** ${this.config.monitoring.toUpperCase()}
- **Payment Processing:** ${this.config.payment.toUpperCase()}
- **Email Service:** ${this.config.email.toUpperCase()}

## 🔧 Manual Setup Instructions

### 1. Prerequisites

${this.config.deployment === 'docker' ? `
#### Docker Deployment
- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 20GB+ disk space
` : ''}

${this.config.deployment === 'pm2' ? `
#### PM2 Deployment
- Node.js 18+
- PM2 process manager
- Nginx (recommended)
- 1GB+ RAM
- 10GB+ disk space
` : ''}

### 2. Environment Configuration

Update the following files with your actual credentials:

#### Backend Environment (\`backend/.env\`)
\`\`\`env
# Update these values:
DISCORD_TOKEN=your_actual_bot_token
DISCORD_CLIENT_ID=your_actual_client_id
DISCORD_CLIENT_SECRET=your_actual_client_secret

${this.config.database === 'mongodb-atlas' ? '# MongoDB Atlas connection string' : ''}
${this.config.database === 'mongodb-atlas' ? 'MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/discord-bot-dashboard' : ''}

${this.config.payment !== 'none' ? '# Payment processor credentials' : ''}
${this.config.payment === 'stripe' || this.config.payment === 'both' ? 'STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key' : ''}
${this.config.payment === 'paypal' || this.config.payment === 'both' ? 'PAYPAL_CLIENT_SECRET=your_paypal_client_secret' : ''}

${this.config.email !== 'none' ? '# Email service credentials' : ''}
${this.config.email === 'gmail' ? 'SMTP_PASS=your_gmail_app_password' : ''}
${this.config.email === 'sendgrid' ? 'SENDGRID_API_KEY=your_sendgrid_api_key' : ''}
\`\`\`

#### Frontend Environment (\`frontend/.env\`)
\`\`\`env
# Update these values:
REACT_APP_DISCORD_CLIENT_ID=your_actual_client_id
${this.config.payment === 'stripe' || this.config.payment === 'both' ? 'REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key' : ''}
\`\`\`

### 3. Database Setup

${this.config.database === 'mongodb-atlas' ? `
#### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your server IP
5. Update the MONGODB_URI in backend/.env
` : ''}

${this.config.database === 'mongodb-local' ? `
#### Local MongoDB
\`\`\`bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
\`\`\`
` : ''}

### 4. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to \`DISCORD_TOKEN\`
5. Go to "OAuth2" section
6. Copy Client ID and Secret to environment files
7. Set redirect URI to: \`http${this.config.ssl ? 's' : ''}://${this.config.domain}/auth/discord/callback\`

### 5. Deployment

${this.config.deployment === 'docker' ? `
#### Docker Deployment
\`\`\`bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
\`\`\`
` : ''}

${this.config.deployment === 'pm2' ? `
#### PM2 Deployment
\`\`\`bash
# Install dependencies and build
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
\`\`\`
` : ''}

### 6. SSL Certificate Setup

${this.config.ssl && this.config.sslType === 'letsencrypt' ? `
#### Let's Encrypt (Automatic)
\`\`\`bash
# Run the SSL setup script
./setup-ssl.sh
\`\`\`
` : ''}

${this.config.ssl && this.config.sslType === 'custom' ? `
#### Custom SSL Certificate
1. Place your certificate files in the \`ssl/\` directory:
   - \`ssl/cert.pem\` (your certificate)
   - \`ssl/key.pem\` (your private key)
2. Restart the services
` : ''}

### 7. Domain Configuration

1. Point your domain to your server's IP address
2. Update DNS A record: \`${this.config.domain} → YOUR_SERVER_IP\`
3. Wait for DNS propagation (up to 24 hours)

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
\`\`\`bash
# Check what's using the port
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Kill the process
sudo kill <PID>
\`\`\`

#### Database Connection Issues
- Check database credentials in \`.env\` files
- Ensure database server is running
- Check firewall settings
- Verify network connectivity

#### SSL Certificate Issues
- Check domain DNS configuration
- Verify certificate files are readable
- Check Nginx configuration
- Review SSL setup logs

### Log Locations

${this.config.deployment === 'docker' ? `
#### Docker Logs
\`\`\`bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
\`\`\`
` : ''}

${this.config.deployment === 'pm2' ? `
#### PM2 Logs
\`\`\`bash
# All processes
pm2 logs

# Specific process
pm2 logs discord-bot-backend
pm2 logs discord-bot-frontend
\`\`\`
` : ''}

## 📊 Monitoring

${this.config.monitoring === 'full' ? `
### Prometheus & Grafana
- **Prometheus:** http${this.config.ssl ? 's' : ''}://${this.config.domain}:9090
- **Grafana:** http${this.config.ssl ? 's' : ''}://${this.config.domain}:3001
  - Username: admin
  - Password: admin (change on first login)
` : ''}

### Health Checks
- **Backend Health:** http${this.config.ssl ? 's' : ''}://${this.config.domain}/api/health
- **Frontend:** http${this.config.ssl ? 's' : ''}://${this.config.domain}

## 🛠️ Maintenance

### Backup
\`\`\`bash
# Database backup (MongoDB)
mongodump --uri="your_mongodb_uri" --out=backup/$(date +%Y%m%d)

# Configuration backup
tar -czf config-backup-$(date +%Y%m%d).tar.gz backend/.env frontend/.env
\`\`\`

### Updates
\`\`\`bash
# Pull latest changes
git pull origin main

# Rebuild and restart
${this.config.deployment === 'docker' ? 'docker-compose up -d --build' : 'pm2 restart ecosystem.config.js'}
\`\`\`

## 📞 Support

- **Documentation:** [GitHub Repository](https://github.com/yourusername/discord-bot-dashboard)
- **Issues:** [Report Issues](https://github.com/yourusername/discord-bot-dashboard/issues)
- **Discord:** [Support Server](https://discord.gg/yourserver)

---

**Generated by Milo Setup Wizard**  
*Configuration saved: ${new Date().toISOString()}*
`;

        fs.writeFileSync(path.join(__dirname, 'DEPLOYMENT.md'), readme);
        console.log('✅ Deployment README generated');
    }

    generateRandomSecret(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async question(query, hidden = false) {
        return new Promise((resolve) => {
            if (hidden) {
                // Simple hidden input simulation
                process.stdout.write(query);
                this.rl.question('', (answer) => {
                    resolve(answer);
                });
            } else {
                this.rl.question(query, (answer) => {
                    resolve(answer);
                });
            }
        });
    }
}

// Start the setup wizard
if (require.main === module) {
    const setup = new ServerSetup();
    setup.start().catch(console.error);
}

module.exports = ServerSetup;