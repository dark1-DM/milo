#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class SecurityScanner {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.issues = [];
        this.recommendations = [];
    }

    async runSecurityScan() {
        console.log('🔒 Starting security scan...\n');
        
        this.issues = [];
        this.recommendations = [];
        
        // Run different security checks
        await this.checkDependencies();
        await this.checkEnvironmentFiles();
        await this.checkFilePermissions();
        await this.checkSecurityHeaders();
        await this.checkSSLConfiguration();
        await this.checkDatabaseSecurity();
        await this.checkAuthenticationSecurity();
        await this.checkInputValidation();
        
        return this.generateSecurityReport();
    }

    async checkDependencies() {
        console.log('📦 Checking dependencies for vulnerabilities...');
        
        try {
            // Check backend dependencies
            const backendPackage = path.join(this.rootDir, 'backend', 'package.json');
            if (fs.existsSync(backendPackage)) {
                await this.runCommand('npm audit --audit-level moderate', { 
                    cwd: path.join(this.rootDir, 'backend'),
                    checkVulnerabilities: true 
                });
            }
            
            // Check frontend dependencies
            const frontendPackage = path.join(this.rootDir, 'frontend', 'package.json');
            if (fs.existsSync(frontendPackage)) {
                await this.runCommand('npm audit --audit-level moderate', { 
                    cwd: path.join(this.rootDir, 'frontend'),
                    checkVulnerabilities: true 
                });
            }
            
            console.log('  ✅ Dependency check completed');
            
        } catch (error) {
            this.issues.push({
                type: 'dependency',
                severity: 'high',
                message: 'Vulnerable dependencies found',
                details: error.message,
                recommendation: 'Run "npm audit fix" to resolve vulnerabilities'
            });
        }
    }

    async checkEnvironmentFiles() {
        console.log('🔐 Checking environment file security...');
        
        const envFiles = [
            path.join(this.rootDir, 'backend', '.env'),
            path.join(this.rootDir, 'frontend', '.env'),
            path.join(this.rootDir, '.env')
        ];
        
        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                const content = fs.readFileSync(envFile, 'utf8');
                
                // Check for weak secrets
                if (content.includes('password=123') || content.includes('secret=abc')) {
                    this.issues.push({
                        type: 'environment',
                        severity: 'critical',
                        message: 'Weak credentials found in environment file',
                        file: envFile,
                        recommendation: 'Use strong, randomly generated passwords and secrets'
                    });
                }
                
                // Check for exposed API keys
                const apiKeyPattern = /(?:api[_-]?key|token|secret)[_-]?[:=]\s*['""]?([a-zA-Z0-9_-]{20,})['""]?/gi;
                const matches = content.match(apiKeyPattern);
                
                if (matches) {
                    this.recommendations.push({
                        type: 'environment',
                        message: 'Ensure API keys and secrets are properly secured',
                        file: envFile,
                        details: `Found ${matches.length} potential API key(s)`
                    });
                }
                
                // Check if .env is in .gitignore
                const gitignore = path.join(this.rootDir, '.gitignore');
                if (fs.existsSync(gitignore)) {
                    const gitignoreContent = fs.readFileSync(gitignore, 'utf8');
                    if (!gitignoreContent.includes('.env')) {
                        this.issues.push({
                            type: 'git',
                            severity: 'high',
                            message: '.env files not in .gitignore',
                            recommendation: 'Add .env to .gitignore to prevent committing secrets'
                        });
                    }
                }
            }
        }
        
        console.log('  ✅ Environment files checked');
    }

    async checkFilePermissions() {
        console.log('📋 Checking file permissions...');
        
        const sensitiveFiles = [
            'backend/.env',
            'frontend/.env',
            'ecosystem.config.js',
            'docker-compose.yml'
        ];
        
        for (const file of sensitiveFiles) {
            const filePath = path.join(this.rootDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    const stats = fs.statSync(filePath);
                    const mode = stats.mode & parseInt('777', 8);
                    
                    // Check if file is world-readable
                    if (mode & parseInt('004', 8)) {
                        this.issues.push({
                            type: 'permissions',
                            severity: 'medium',
                            message: `File ${file} is world-readable`,
                            recommendation: 'Restrict file permissions: chmod 600'
                        });
                    }
                } catch (error) {
                    // Permissions check not available on Windows
                }
            }
        }
        
        console.log('  ✅ File permissions checked');
    }

    async checkSecurityHeaders() {
        console.log('🛡️  Checking security headers...');
        
        // Check if security middleware is configured
        const serverFiles = [
            path.join(this.rootDir, 'backend', 'server.js'),
            path.join(this.rootDir, 'backend', 'app.js'),
            path.join(this.rootDir, 'backend', 'index.js')
        ];
        
        let helmetFound = false;
        let corsConfigured = false;
        
        for (const serverFile of serverFiles) {
            if (fs.existsSync(serverFile)) {
                const content = fs.readFileSync(serverFile, 'utf8');
                
                if (content.includes('helmet')) {
                    helmetFound = true;
                }
                
                if (content.includes('cors') && content.includes('origin:')) {
                    corsConfigured = true;
                }
            }
        }
        
        if (!helmetFound) {
            this.recommendations.push({
                type: 'security-headers',
                message: 'Security headers middleware not found',
                recommendation: 'Install and configure helmet.js for security headers'
            });
        }
        
        if (!corsConfigured) {
            this.recommendations.push({
                type: 'cors',
                message: 'CORS not properly configured',
                recommendation: 'Configure CORS with specific origins instead of allowing all'
            });
        }
        
        console.log('  ✅ Security headers checked');
    }

    async checkSSLConfiguration() {
        console.log('🔒 Checking SSL/TLS configuration...');
        
        // Check if HTTPS is enforced
        const nginxConfig = path.join(this.rootDir, 'nginx', 'nginx.conf');
        if (fs.existsSync(nginxConfig)) {
            const content = fs.readFileSync(nginxConfig, 'utf8');
            
            if (!content.includes('ssl_certificate')) {
                this.recommendations.push({
                    type: 'ssl',
                    message: 'SSL certificate not configured in Nginx',
                    recommendation: 'Configure SSL certificate for HTTPS'
                });
            }
            
            if (!content.includes('return 301 https://')) {
                this.recommendations.push({
                    type: 'ssl',
                    message: 'HTTP to HTTPS redirect not configured',
                    recommendation: 'Force HTTPS redirects for all HTTP requests'
                });
            }
        }
        
        console.log('  ✅ SSL configuration checked');
    }

    async checkDatabaseSecurity() {
        console.log('💾 Checking database security...');
        
        const envFiles = [
            path.join(this.rootDir, 'backend', '.env'),
            path.join(this.rootDir, '.env')
        ];
        
        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                const content = fs.readFileSync(envFile, 'utf8');
                
                // Check MongoDB URI
                const mongoUri = content.match(/MONGODB_URI=(.+)/);
                if (mongoUri && mongoUri[1]) {
                    const uri = mongoUri[1];
                    
                    // Check for default credentials
                    if (uri.includes('admin:password') || uri.includes('root:root')) {
                        this.issues.push({
                            type: 'database',
                            severity: 'critical',
                            message: 'Default database credentials detected',
                            recommendation: 'Use strong, unique database credentials'
                        });
                    }
                    
                    // Check for unencrypted connection
                    if (!uri.includes('ssl=true') && !uri.includes('mongodb+srv://')) {
                        this.recommendations.push({
                            type: 'database',
                            message: 'Database connection not encrypted',
                            recommendation: 'Use SSL/TLS for database connections'
                        });
                    }
                }
            }
        }
        
        console.log('  ✅ Database security checked');
    }

    async checkAuthenticationSecurity() {
        console.log('🔑 Checking authentication security...');
        
        const authFiles = [
            path.join(this.rootDir, 'backend', 'routes', 'auth.js'),
            path.join(this.rootDir, 'backend', 'middleware', 'auth.js'),
            path.join(this.rootDir, 'backend', 'controllers', 'auth.js')
        ];
        
        let jwtSecretStrong = true;
        let rateLimitingFound = false;
        
        for (const authFile of authFiles) {
            if (fs.existsSync(authFile)) {
                const content = fs.readFileSync(authFile, 'utf8');
                
                // Check JWT secret strength
                if (content.includes('jwt.sign') && content.includes('secret')) {
                    const secretMatch = content.match(/secret['"]*:\s*['"](.*?)['"]/) || 
                                      content.match(/JWT_SECRET['"]*\s*[=:]\s*['"](.*?)['"]/) ||
                                      content.match(/process\.env\.JWT_SECRET/);
                    
                    if (secretMatch && secretMatch[1] && secretMatch[1].length < 32) {
                        jwtSecretStrong = false;
                    }
                }
                
                // Check for rate limiting
                if (content.includes('express-rate-limit') || content.includes('rateLimit')) {
                    rateLimitingFound = true;
                }
            }
        }
        
        if (!jwtSecretStrong) {
            this.issues.push({
                type: 'authentication',
                severity: 'high',
                message: 'JWT secret is too weak',
                recommendation: 'Use a strong, randomly generated JWT secret (at least 32 characters)'
            });
        }
        
        if (!rateLimitingFound) {
            this.recommendations.push({
                type: 'authentication',
                message: 'Rate limiting not implemented',
                recommendation: 'Implement rate limiting for authentication endpoints'
            });
        }
        
        console.log('  ✅ Authentication security checked');
    }

    async checkInputValidation() {
        console.log('✅ Checking input validation...');
        
        const routeFiles = [];
        const routesDir = path.join(this.rootDir, 'backend', 'routes');
        
        if (fs.existsSync(routesDir)) {
            const files = fs.readdirSync(routesDir);
            files.forEach(file => {
                if (file.endsWith('.js')) {
                    routeFiles.push(path.join(routesDir, file));
                }
            });
        }
        
        let validationFound = false;
        let sanitizationFound = false;
        
        for (const routeFile of routeFiles) {
            const content = fs.readFileSync(routeFile, 'utf8');
            
            // Check for validation middleware
            if (content.includes('joi') || content.includes('express-validator') || content.includes('yup')) {
                validationFound = true;
            }
            
            // Check for sanitization
            if (content.includes('sanitize') || content.includes('escape') || content.includes('validator')) {
                sanitizationFound = true;
            }
        }
        
        if (!validationFound) {
            this.recommendations.push({
                type: 'input-validation',
                message: 'Input validation middleware not found',
                recommendation: 'Implement input validation using joi, express-validator, or similar'
            });
        }
        
        if (!sanitizationFound) {
            this.recommendations.push({
                type: 'input-sanitization',
                message: 'Input sanitization not implemented',
                recommendation: 'Sanitize user inputs to prevent XSS and injection attacks'
            });
        }
        
        console.log('  ✅ Input validation checked');
    }

    generateSecurityReport() {
        const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
        const highIssues = this.issues.filter(i => i.severity === 'high').length;
        const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
        const lowIssues = this.issues.filter(i => i.severity === 'low').length;
        
        const overallScore = this.calculateSecurityScore();
        const riskLevel = this.determineRiskLevel(overallScore);
        
        const report = {
            timestamp: new Date().toISOString(),
            overall: {
                score: overallScore,
                riskLevel: riskLevel,
                totalIssues: this.issues.length,
                totalRecommendations: this.recommendations.length
            },
            issues: {
                critical: criticalIssues,
                high: highIssues,
                medium: mediumIssues,
                low: lowIssues
            },
            details: {
                issues: this.issues,
                recommendations: this.recommendations
            }
        };
        
        this.displaySecurityReport(report);
        this.saveSecurityReport(report);
        
        return report;
    }

    calculateSecurityScore() {
        let score = 100;
        
        this.issues.forEach(issue => {
            switch (issue.severity) {
                case 'critical':
                    score -= 25;
                    break;
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        });
        
        // Deduct points for missing recommendations
        score -= this.recommendations.length * 2;
        
        return Math.max(0, score);
    }

    determineRiskLevel(score) {
        if (score >= 90) return 'LOW';
        if (score >= 70) return 'MEDIUM';
        if (score >= 50) return 'HIGH';
        return 'CRITICAL';
    }

    displaySecurityReport(report) {
        console.log('\n🔒 Security Scan Report');
        console.log('=======================');
        console.log(`🕐 Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
        
        const riskIcon = report.overall.riskLevel === 'LOW' ? '✅' :
                        report.overall.riskLevel === 'MEDIUM' ? '⚠️' :
                        report.overall.riskLevel === 'HIGH' ? '🔶' : '🚨';
        
        console.log(`${riskIcon} Security Score: ${report.overall.score}/100`);
        console.log(`🎯 Risk Level: ${report.overall.riskLevel}`);
        console.log(`🔍 Issues Found: ${report.overall.totalIssues}`);
        console.log(`💡 Recommendations: ${report.overall.totalRecommendations}`);
        
        if (report.issues.critical > 0) {
            console.log(`🚨 Critical Issues: ${report.issues.critical}`);
        }
        if (report.issues.high > 0) {
            console.log(`🔶 High Priority Issues: ${report.issues.high}`);
        }
        if (report.issues.medium > 0) {
            console.log(`⚠️  Medium Priority Issues: ${report.issues.medium}`);
        }
        if (report.issues.low > 0) {
            console.log(`ℹ️  Low Priority Issues: ${report.issues.low}`);
        }
        
        if (this.issues.length > 0) {
            console.log('\n🔍 Security Issues:');
            console.log('==================');
            
            this.issues.forEach((issue, index) => {
                const severityIcon = issue.severity === 'critical' ? '🚨' :
                                   issue.severity === 'high' ? '🔶' :
                                   issue.severity === 'medium' ? '⚠️' : 'ℹ️';
                
                console.log(`${severityIcon} ${issue.type.toUpperCase()}: ${issue.message}`);
                if (issue.file) console.log(`   📁 File: ${issue.file}`);
                if (issue.details) console.log(`   📋 Details: ${issue.details}`);
                console.log(`   💡 Recommendation: ${issue.recommendation}`);
                console.log('');
            });
        }
        
        if (this.recommendations.length > 0) {
            console.log('\n💡 Security Recommendations:');
            console.log('============================');
            
            this.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.type.toUpperCase()}: ${rec.message}`);
                if (rec.file) console.log(`   📁 File: ${rec.file}`);
                if (rec.details) console.log(`   📋 Details: ${rec.details}`);
                console.log(`   💡 Recommendation: ${rec.recommendation}`);
                console.log('');
            });
        }
    }

    saveSecurityReport(report) {
        const reportsDir = path.join(this.rootDir, 'security-reports');
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `security-report-${Date.now()}.json`;
        const filepath = path.join(reportsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Security report saved: ${filepath}`);
        
        // Keep only last 20 reports
        const files = fs.readdirSync(reportsDir)
            .filter(f => f.startsWith('security-report-'))
            .sort()
            .reverse();
        
        if (files.length > 20) {
            files.slice(20).forEach(file => {
                fs.unlinkSync(path.join(reportsDir, file));
            });
        }
    }

    async runCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = { cwd: this.rootDir, ...options };
            
            exec(command, defaultOptions, (error, stdout, stderr) => {
                if (error && options.checkVulnerabilities) {
                    // npm audit returns non-zero exit code when vulnerabilities are found
                    reject(error);
                } else if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
}

// Run security scanner if called directly
if (require.main === module) {
    const scanner = new SecurityScanner();
    scanner.runSecurityScan()
        .then(report => {
            process.exit(report.overall.riskLevel === 'CRITICAL' ? 1 : 0);
        })
        .catch(error => {
            console.error('❌ Security scan failed:', error);
            process.exit(1);
        });
}

module.exports = SecurityScanner;