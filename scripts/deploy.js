#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const readline = require('readline');

class DeploymentManager {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async startDeployment() {
        console.log('🚀 Milo Deployment Manager\n');
        
        try {
            const deploymentType = await this.selectDeploymentType();
            
            switch (deploymentType) {
                case 'docker':
                    await this.deployWithDocker();
                    break;
                case 'pm2':
                    await this.deployWithPM2();
                    break;
                case 'kubernetes':
                    await this.deployWithKubernetes();
                    break;
                case 'heroku':
                    await this.deployToHeroku();
                    break;
                case 'netlify':
                    await this.deployToNetlify();
                    break;
                case 'digitalocean':
                    await this.deployToDigitalOcean();
                    break;
                case 'aws':
                    await this.deployToAWS();
                    break;
                case 'azure':
                    await this.deployToAzure();
                    break;
                default:
                    console.log('❌ Invalid deployment type');
            }
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async selectDeploymentType() {
        console.log('Select deployment type:');
        console.log('======================');
        console.log('1. 🐳 Docker Compose (Recommended)');
        console.log('2. ⚡ PM2 Process Manager');
        console.log('3. ☸️  Kubernetes');
        console.log('4. 🟣 Heroku');
        console.log('5. 🔷 Netlify (Frontend only)');
        console.log('6. 🌊 DigitalOcean');
        console.log('7. 🟠 AWS');
        console.log('8. 🔵 Azure');
        console.log('');
        
        const answer = await this.question('Select option (1-8): ');
        
        const types = {
            '1': 'docker',
            '2': 'pm2',
            '3': 'kubernetes',
            '4': 'heroku',
            '5': 'netlify',
            '6': 'digitalocean',
            '7': 'aws',
            '8': 'azure'
        };
        
        return types[answer] || 'docker';
    }

    async deployWithDocker() {
        console.log('🐳 Deploying with Docker Compose...\n');
        
        // Check if Docker is installed
        if (!await this.checkCommand('docker')) {
            console.log('❌ Docker is not installed. Please install Docker first.');
            return;
        }
        
        // Check if docker-compose exists
        const composeFile = path.join(this.rootDir, 'docker-compose.yml');
        if (!fs.existsSync(composeFile)) {
            console.log('⚠️  No docker-compose.yml found. Creating one...');
            await this.createDockerCompose();
        }
        
        // Build and start containers
        console.log('🔨 Building Docker images...');
        await this.runCommand('docker-compose build');
        
        console.log('🚀 Starting containers...');
        await this.runCommand('docker-compose up -d');
        
        console.log('🔍 Checking container status...');
        await this.runCommand('docker-compose ps');
        
        console.log('\n✅ Docker deployment completed!');
        console.log('🌐 Frontend: http://localhost:3000');
        console.log('🔧 Backend: http://localhost:5000');
        console.log('📊 Monitoring: http://localhost:3001 (if enabled)');
    }

    async deployWithPM2() {
        console.log('⚡ Deploying with PM2...\n');
        
        // Check if PM2 is installed
        if (!await this.checkCommand('pm2')) {
            console.log('📦 Installing PM2...');
            await this.runCommand('npm install -g pm2');
        }
        
        // Check if ecosystem.config.js exists
        const ecosystemFile = path.join(this.rootDir, 'ecosystem.config.js');
        if (!fs.existsSync(ecosystemFile)) {
            console.log('⚠️  No ecosystem.config.js found. Creating one...');
            await this.createEcosystemConfig();
        }
        
        // Install dependencies
        console.log('📦 Installing dependencies...');
        await this.runCommand('npm install', { cwd: path.join(this.rootDir, 'backend') });
        await this.runCommand('npm install', { cwd: path.join(this.rootDir, 'frontend') });
        
        // Build frontend
        console.log('🔨 Building frontend...');
        await this.runCommand('npm run build', { cwd: path.join(this.rootDir, 'frontend') });
        
        // Start applications with PM2
        console.log('🚀 Starting applications with PM2...');
        await this.runCommand('pm2 start ecosystem.config.js');
        
        console.log('💾 Saving PM2 configuration...');
        await this.runCommand('pm2 save');
        
        console.log('⚙️  Setting up PM2 startup...');
        await this.runCommand('pm2 startup');
        
        console.log('\n✅ PM2 deployment completed!');
        await this.runCommand('pm2 status');
    }

    async deployWithKubernetes() {
        console.log('☸️  Deploying with Kubernetes...\n');
        
        // Check if kubectl is installed
        if (!await this.checkCommand('kubectl')) {
            console.log('❌ kubectl is not installed. Please install kubectl first.');
            return;
        }
        
        // Create Kubernetes manifests if they don't exist
        const k8sDir = path.join(this.rootDir, 'k8s');
        if (!fs.existsSync(k8sDir)) {
            console.log('📁 Creating Kubernetes manifests...');
            await this.createKubernetesManifests();
        }
        
        // Build and push Docker images
        const registry = await this.question('Enter Docker registry (e.g., your-registry.com): ');
        
        console.log('🔨 Building and pushing images...');
        await this.runCommand(`docker build -t ${registry}/discord-bot-backend ./backend`);
        await this.runCommand(`docker build -t ${registry}/discord-bot-frontend ./frontend`);
        
        if (await this.confirmAction('Push images to registry?')) {
            await this.runCommand(`docker push ${registry}/discord-bot-backend`);
            await this.runCommand(`docker push ${registry}/discord-bot-frontend`);
        }
        
        // Deploy to Kubernetes
        console.log('🚀 Deploying to Kubernetes...');
        await this.runCommand('kubectl apply -f k8s/');
        
        console.log('🔍 Checking deployment status...');
        await this.runCommand('kubectl get pods');
        await this.runCommand('kubectl get services');
        
        console.log('\n✅ Kubernetes deployment completed!');
    }

    async deployToHeroku() {
        console.log('🟣 Deploying to Heroku...\n');
        
        // Check if Heroku CLI is installed
        if (!await this.checkCommand('heroku')) {
            console.log('❌ Heroku CLI is not installed. Please install it first.');
            return;
        }
        
        // Login check
        console.log('🔐 Checking Heroku authentication...');
        try {
            await this.runCommand('heroku auth:whoami');
        } catch (error) {
            console.log('Please login to Heroku first: heroku login');
            return;
        }
        
        const appName = await this.question('Enter Heroku app name: ');
        
        // Create or use existing app
        try {
            await this.runCommand(`heroku create ${appName}`);
        } catch (error) {
            console.log(`Using existing app: ${appName}`);
        }
        
        // Set environment variables
        console.log('⚙️  Setting environment variables...');
        const envVars = await this.getHerokuEnvVars();
        for (const [key, value] of Object.entries(envVars)) {
            await this.runCommand(`heroku config:set ${key}="${value}" --app ${appName}`);
        }
        
        // Add MongoDB addon if needed
        if (await this.confirmAction('Add MongoDB Atlas addon?')) {
            await this.runCommand(`heroku addons:create mongolab:sandbox --app ${appName}`);
        }
        
        // Deploy
        console.log('🚀 Deploying to Heroku...');
        await this.runCommand('git add -A');
        await this.runCommand('git commit -m "Deploy to Heroku" || true');
        await this.runCommand(`git push heroku main`);
        
        console.log('\n✅ Heroku deployment completed!');
        console.log(`🌐 App URL: https://${appName}.herokuapp.com`);
    }

    async deployToNetlify() {
        console.log('🔷 Deploying frontend to Netlify...\n');
        
        // Check if Netlify CLI is installed
        if (!await this.checkCommand('netlify')) {
            console.log('📦 Installing Netlify CLI...');
            await this.runCommand('npm install -g netlify-cli');
        }
        
        // Build frontend
        console.log('🔨 Building frontend...');
        await this.runCommand('npm install', { cwd: path.join(this.rootDir, 'frontend') });
        await this.runCommand('npm run build', { cwd: path.join(this.rootDir, 'frontend') });
        
        // Deploy to Netlify
        console.log('🚀 Deploying to Netlify...');
        const buildDir = path.join(this.rootDir, 'frontend', 'build');
        
        if (await this.confirmAction('Deploy as new site?')) {
            await this.runCommand(`netlify deploy --prod --dir ${buildDir}`);
        } else {
            const siteId = await this.question('Enter Netlify site ID: ');
            await this.runCommand(`netlify deploy --prod --dir ${buildDir} --site ${siteId}`);
        }
        
        console.log('\n✅ Netlify deployment completed!');
    }

    async deployToDigitalOcean() {
        console.log('🌊 Deploying to DigitalOcean...\n');
        
        console.log('📋 DigitalOcean deployment options:');
        console.log('1. App Platform (Recommended)');
        console.log('2. Droplet with Docker');
        console.log('3. Kubernetes');
        
        const option = await this.question('Select option (1-3): ');
        
        switch (option) {
            case '1':
                await this.deployToDigitalOceanApp();
                break;
            case '2':
                await this.deployToDigitalOceanDroplet();
                break;
            case '3':
                await this.deployToDigitalOceanK8s();
                break;
            default:
                await this.deployToDigitalOceanApp();
        }
    }

    async deployToDigitalOceanApp() {
        console.log('🚀 Deploying to DigitalOcean App Platform...');
        
        // Create app.yaml if it doesn't exist
        const appYaml = path.join(this.rootDir, '.do', 'app.yaml');
        if (!fs.existsSync(appYaml)) {
            console.log('📄 Creating DigitalOcean app specification...');
            await this.createDigitalOceanAppSpec();
        }
        
        console.log('📋 Please follow these steps:');
        console.log('1. Go to https://cloud.digitalocean.com/apps');
        console.log('2. Click "Create App"');
        console.log('3. Connect your Git repository');
        console.log('4. Upload the app.yaml file from .do/app.yaml');
        console.log('5. Review and deploy');
    }

    async deployToAWS() {
        console.log('🟠 AWS Deployment Options...\n');
        
        console.log('📋 Available AWS deployment methods:');
        console.log('1. Elastic Beanstalk');
        console.log('2. ECS with Fargate');
        console.log('3. EKS (Kubernetes)');
        console.log('4. Lambda + API Gateway');
        
        const option = await this.question('Select option (1-4): ');
        
        switch (option) {
            case '1':
                await this.deployToElasticBeanstalk();
                break;
            case '2':
                await this.deployToECS();
                break;
            case '3':
                await this.deployToEKS();
                break;
            case '4':
                await this.deployToLambda();
                break;
            default:
                await this.deployToElasticBeanstalk();
        }
    }

    async deployToAzure() {
        console.log('🔵 Azure Deployment Options...\n');
        
        console.log('📋 Available Azure deployment methods:');
        console.log('1. App Service');
        console.log('2. Container Instances');
        console.log('3. AKS (Kubernetes)');
        console.log('4. Functions');
        
        const option = await this.question('Select option (1-4): ');
        
        switch (option) {
            case '1':
                await this.deployToAzureAppService();
                break;
            case '2':
                await this.deployToAzureContainerInstances();
                break;
            case '3':
                await this.deployToAKS();
                break;
            case '4':
                await this.deployToAzureFunctions();
                break;
            default:
                await this.deployToAzureAppService();
        }
    }

    // Helper methods
    async checkCommand(command) {
        try {
            await this.runCommand(`${command} --version`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async runCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = { cwd: this.rootDir, ...options };
            
            console.log(`🔧 Running: ${command}`);
            
            exec(command, defaultOptions, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                    reject(error);
                } else {
                    if (stdout) console.log(stdout);
                    if (stderr) console.log(stderr);
                    resolve(stdout);
                }
            });
        });
    }

    async confirmAction(message) {
        const answer = await this.question(`${message} (y/N): `);
        return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    }

    question(query) {
        return new Promise(resolve => {
            this.rl.question(query, resolve);
        });
    }

    async createDockerCompose() {
        // Docker Compose creation logic would go here
        console.log('📄 Creating docker-compose.yml...');
    }

    async createEcosystemConfig() {
        // PM2 ecosystem config creation logic would go here
        console.log('📄 Creating ecosystem.config.js...');
    }

    async getHerokuEnvVars() {
        // Return environment variables for Heroku
        return {
            NODE_ENV: 'production',
            NPM_CONFIG_PRODUCTION: 'false'
        };
    }

    // Additional deployment method implementations would go here...
}

// Run deployment manager if called directly
if (require.main === module) {
    const deployment = new DeploymentManager();
    deployment.startDeployment().catch(console.error);
}

module.exports = DeploymentManager;