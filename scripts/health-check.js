#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class HealthChecker {
    constructor() {
        this.services = [];
        this.results = [];
        this.config = this.loadConfig();
    }

    loadConfig() {
        const configPath = path.join(__dirname, 'health-config.json');
        
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Default configuration
        return {
            services: [
                {
                    name: 'Frontend',
                    type: 'http',
                    url: 'http://localhost:3000',
                    timeout: 5000,
                    expectedStatus: 200
                },
                {
                    name: 'Backend API',
                    type: 'http',
                    url: 'http://localhost:5000/api/health',
                    timeout: 5000,
                    expectedStatus: 200
                },
                {
                    name: 'Database',
                    type: 'mongodb',
                    timeout: 5000
                },
                {
                    name: 'Discord Bot',
                    type: 'process',
                    process: 'node',
                    args: ['bot.js'],
                    cwd: './backend'
                }
            ],
            alerts: {
                email: {
                    enabled: false,
                    smtp: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        user: '',
                        pass: ''
                    },
                    to: [],
                    from: ''
                },
                webhook: {
                    enabled: false,
                    url: '',
                    method: 'POST'
                }
            },
            schedule: {
                enabled: false,
                interval: 300000 // 5 minutes
            }
        };
    }

    async checkAllServices() {
        console.log('🔍 Starting health check...\n');
        
        this.results = [];
        const promises = this.config.services.map(service => this.checkService(service));
        
        await Promise.all(promises);
        
        return this.generateReport();
    }

    async checkService(service) {
        const startTime = Date.now();
        let result = {
            name: service.name,
            type: service.type,
            status: 'unknown',
            responseTime: 0,
            error: null,
            details: {},
            timestamp: new Date().toISOString()
        };
        
        try {
            switch (service.type) {
                case 'http':
                case 'https':
                    result = await this.checkHttpService(service, result);
                    break;
                case 'mongodb':
                    result = await this.checkMongoService(service, result);
                    break;
                case 'process':
                    result = await this.checkProcessService(service, result);
                    break;
                case 'tcp':
                    result = await this.checkTcpService(service, result);
                    break;
                case 'file':
                    result = await this.checkFileService(service, result);
                    break;
                default:
                    result.status = 'error';
                    result.error = `Unknown service type: ${service.type}`;
            }
        } catch (error) {
            result.status = 'error';
            result.error = error.message;
        }
        
        result.responseTime = Date.now() - startTime;
        this.results.push(result);
        
        const statusIcon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${result.name}: ${result.status} (${result.responseTime}ms)`);
        
        return result;
    }

    async checkHttpService(service, result) {
        return new Promise((resolve) => {
            const url = new URL(service.url);
            const client = url.protocol === 'https:' ? https : http;
            
            const request = client.get(service.url, { timeout: service.timeout }, (res) => {
                result.details.statusCode = res.statusCode;
                result.details.headers = res.headers;
                
                if (res.statusCode === (service.expectedStatus || 200)) {
                    result.status = 'healthy';
                } else {
                    result.status = 'warning';
                    result.error = `Expected status ${service.expectedStatus || 200}, got ${res.statusCode}`;
                }
                
                resolve(result);
            });
            
            request.on('error', (error) => {
                result.status = 'error';
                result.error = error.message;
                resolve(result);
            });
            
            request.on('timeout', () => {
                result.status = 'error';
                result.error = 'Request timeout';
                request.destroy();
                resolve(result);
            });
        });
    }

    async checkMongoService(service, result) {
        return new Promise((resolve) => {
            // Check if MongoDB is accessible
            const envPath = path.join(__dirname, '..', 'backend', '.env');
            
            if (!fs.existsSync(envPath)) {
                result.status = 'error';
                result.error = 'No .env file found';
                resolve(result);
                return;
            }
            
            const envContent = fs.readFileSync(envPath, 'utf8');
            const mongoUri = envContent.match(/MONGODB_URI=(.+)/);
            
            if (!mongoUri) {
                result.status = 'error';
                result.error = 'No MongoDB URI found in .env';
                resolve(result);
                return;
            }
            
            exec('mongosh --version', (error) => {
                if (error) {
                    result.status = 'warning';
                    result.error = 'mongosh not installed, cannot verify connection';
                    resolve(result);
                    return;
                }
                
                exec(`mongosh "${mongoUri[1]}" --eval "db.adminCommand('ping')" --quiet`, (error, stdout) => {
                    if (error) {
                        result.status = 'error';
                        result.error = 'Failed to connect to MongoDB';
                    } else {
                        result.status = 'healthy';
                        result.details.connection = 'successful';
                    }
                    resolve(result);
                });
            });
        });
    }

    async checkProcessService(service, result) {
        return new Promise((resolve) => {
            const command = process.platform === 'win32' ? 'tasklist' : 'ps aux';
            
            exec(command, (error, stdout) => {
                if (error) {
                    result.status = 'error';
                    result.error = error.message;
                    resolve(result);
                    return;
                }
                
                const processRunning = stdout.includes(service.process);
                
                if (processRunning) {
                    result.status = 'healthy';
                    result.details.processFound = true;
                } else {
                    result.status = 'error';
                    result.error = `Process ${service.process} not found`;
                }
                
                resolve(result);
            });
        });
    }

    async checkTcpService(service, result) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            socket.setTimeout(service.timeout || 5000);
            
            socket.connect(service.port, service.host, () => {
                result.status = 'healthy';
                result.details.connection = 'successful';
                socket.destroy();
                resolve(result);
            });
            
            socket.on('error', (error) => {
                result.status = 'error';
                result.error = error.message;
                resolve(result);
            });
            
            socket.on('timeout', () => {
                result.status = 'error';
                result.error = 'Connection timeout';
                socket.destroy();
                resolve(result);
            });
        });
    }

    async checkFileService(service, result) {
        return new Promise((resolve) => {
            const filePath = path.resolve(service.path);
            
            fs.access(filePath, fs.constants.F_OK, (error) => {
                if (error) {
                    result.status = 'error';
                    result.error = `File not found: ${filePath}`;
                } else {
                    result.status = 'healthy';
                    const stats = fs.statSync(filePath);
                    result.details.size = stats.size;
                    result.details.modified = stats.mtime;
                }
                resolve(result);
            });
        });
    }

    generateReport() {
        const totalServices = this.results.length;
        const healthyServices = this.results.filter(r => r.status === 'healthy').length;
        const warningServices = this.results.filter(r => r.status === 'warning').length;
        const errorServices = this.results.filter(r => r.status === 'error').length;
        
        const overallStatus = errorServices > 0 ? 'critical' :
                             warningServices > 0 ? 'warning' : 'healthy';
        
        const report = {
            timestamp: new Date().toISOString(),
            overall: {
                status: overallStatus,
                healthy: healthyServices,
                warning: warningServices,
                error: errorServices,
                total: totalServices
            },
            services: this.results,
            summary: {
                uptime: this.calculateUptime(),
                averageResponseTime: this.calculateAverageResponseTime()
            }
        };
        
        this.displayReport(report);
        this.saveReport(report);
        
        if (this.config.alerts && (errorServices > 0 || warningServices > 0)) {
            this.sendAlerts(report);
        }
        
        return report;
    }

    displayReport(report) {
        console.log('\n📊 Health Check Report');
        console.log('======================');
        console.log(`🕐 Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
        
        const statusIcon = report.overall.status === 'healthy' ? '✅' :
                          report.overall.status === 'warning' ? '⚠️' : '❌';
        
        console.log(`${statusIcon} Overall Status: ${report.overall.status.toUpperCase()}`);
        console.log(`📈 Services: ${report.overall.healthy}/${report.overall.total} healthy`);
        
        if (report.overall.warning > 0) {
            console.log(`⚠️  Warnings: ${report.overall.warning}`);
        }
        
        if (report.overall.error > 0) {
            console.log(`❌ Errors: ${report.overall.error}`);
        }
        
        console.log(`⚡ Average Response Time: ${report.summary.averageResponseTime}ms`);
        
        console.log('\n📋 Service Details:');
        console.log('===================');
        
        this.results.forEach(service => {
            const icon = service.status === 'healthy' ? '✅' :
                        service.status === 'warning' ? '⚠️' : '❌';
            
            console.log(`${icon} ${service.name}`);
            console.log(`   Status: ${service.status}`);
            console.log(`   Response Time: ${service.responseTime}ms`);
            
            if (service.error) {
                console.log(`   Error: ${service.error}`);
            }
            
            if (Object.keys(service.details).length > 0) {
                console.log(`   Details: ${JSON.stringify(service.details, null, 4)}`);
            }
            
            console.log('');
        });
    }

    saveReport(report) {
        const reportsDir = path.join(__dirname, '..', 'health-reports');
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `health-report-${Date.now()}.json`;
        const filepath = path.join(reportsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        // Keep only last 50 reports
        const files = fs.readdirSync(reportsDir)
            .filter(f => f.startsWith('health-report-'))
            .sort()
            .reverse();
        
        if (files.length > 50) {
            files.slice(50).forEach(file => {
                fs.unlinkSync(path.join(reportsDir, file));
            });
        }
    }

    calculateUptime() {
        const healthyCount = this.results.filter(r => r.status === 'healthy').length;
        return Math.round((healthyCount / this.results.length) * 100);
    }

    calculateAverageResponseTime() {
        const totalTime = this.results.reduce((sum, result) => sum + result.responseTime, 0);
        return Math.round(totalTime / this.results.length);
    }

    async sendAlerts(report) {
        if (this.config.alerts.email.enabled) {
            await this.sendEmailAlert(report);
        }
        
        if (this.config.alerts.webhook.enabled) {
            await this.sendWebhookAlert(report);
        }
    }

    async sendEmailAlert(report) {
        // Email alert implementation would go here
        console.log('📧 Email alerts not implemented yet');
    }

    async sendWebhookAlert(report) {
        // Webhook alert implementation would go here
        console.log('🔗 Webhook alerts not implemented yet');
    }

    async startScheduledChecks() {
        if (!this.config.schedule.enabled) {
            console.log('⏰ Scheduled checks are disabled');
            return;
        }
        
        console.log(`⏰ Starting scheduled health checks every ${this.config.schedule.interval / 1000} seconds`);
        
        setInterval(async () => {
            await this.checkAllServices();
        }, this.config.schedule.interval);
        
        // Run initial check
        await this.checkAllServices();
    }

    generateConfigFile() {
        const configPath = path.join(__dirname, 'health-config.json');
        
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
            console.log(`✅ Generated health check configuration: ${configPath}`);
        } else {
            console.log(`⚠️  Configuration file already exists: ${configPath}`);
        }
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const healthChecker = new HealthChecker();
    
    if (args.includes('--generate-config')) {
        healthChecker.generateConfigFile();
    } else if (args.includes('--schedule')) {
        healthChecker.startScheduledChecks();
    } else {
        healthChecker.checkAllServices()
            .then(report => {
                process.exit(report.overall.status !== 'healthy' ? 1 : 0);
            })
            .catch(error => {
                console.error('❌ Health check failed:', error);
                process.exit(1);
            });
    }
}

module.exports = HealthChecker;