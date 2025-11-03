#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async createBackup() {
        console.log('🔄 Creating comprehensive backup...\n');
        
        const backupName = `discord-bot-backup-${this.timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            // Create backup directory
            fs.mkdirSync(backupPath, { recursive: true });
            
            // Backup configuration files
            await this.backupConfigurations(backupPath);
            
            // Backup database
            await this.backupDatabase(backupPath);
            
            // Backup uploaded files
            await this.backupUploads(backupPath);
            
            // Backup logs
            await this.backupLogs(backupPath);
            
            // Create backup manifest
            await this.createManifest(backupPath);
            
            // Create compressed archive
            const archivePath = await this.createArchive(backupPath, backupName);
            
            console.log(`✅ Backup completed successfully!`);
            console.log(`📦 Archive: ${archivePath}`);
            console.log(`📁 Backup size: ${this.getFileSize(archivePath)}`);
            
            // Clean up temporary directory
            this.cleanupDirectory(backupPath);
            
        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            process.exit(1);
        }
    }

    async backupConfigurations(backupPath) {
        console.log('📝 Backing up configuration files...');
        
        const configDir = path.join(backupPath, 'config');
        fs.mkdirSync(configDir, { recursive: true });
        
        const filesToBackup = [
            'backend/.env',
            'frontend/.env',
            'backend/.env.production',
            'frontend/.env.production',
            'docker-compose.yml',
            'ecosystem.config.js',
            'nginx/nginx.conf',
            'package.json',
            'backend/package.json',
            'frontend/package.json'
        ];
        
        for (const file of filesToBackup) {
            const sourcePath = path.join(__dirname, '..', file);
            if (fs.existsSync(sourcePath)) {
                const targetPath = path.join(configDir, file.replace(/\//g, '_'));
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`  ✅ ${file}`);
            }
        }
    }

    async backupDatabase(backupPath) {
        console.log('💾 Backing up database...');
        
        const dbDir = path.join(backupPath, 'database');
        fs.mkdirSync(dbDir, { recursive: true });
        
        // Check if .env exists to get database URI
        const envPath = path.join(__dirname, '..', 'backend', '.env');
        if (!fs.existsSync(envPath)) {
            console.log('  ⚠️  No .env file found, skipping database backup');
            return;
        }
        
        const envContent = fs.readFileSync(envPath, 'utf8');
        const mongoUri = envContent.match(/MONGODB_URI=(.+)/);
        
        if (mongoUri) {
            try {
                const dbBackupPath = path.join(dbDir, 'mongodb-dump');
                execSync(`mongodump --uri="${mongoUri[1]}" --out="${dbBackupPath}"`, { stdio: 'inherit' });
                console.log('  ✅ MongoDB backup completed');
            } catch (error) {
                console.log('  ⚠️  MongoDB backup failed:', error.message);
            }
        } else {
            console.log('  ⚠️  No MongoDB URI found, skipping database backup');
        }
    }

    async backupUploads(backupPath) {
        console.log('📁 Backing up uploaded files...');
        
        const uploadsSource = path.join(__dirname, '..', 'backend', 'uploads');
        if (fs.existsSync(uploadsSource)) {
            const uploadsTarget = path.join(backupPath, 'uploads');
            this.copyDirectory(uploadsSource, uploadsTarget);
            console.log('  ✅ Uploads backup completed');
        } else {
            console.log('  ⚠️  No uploads directory found');
        }
    }

    async backupLogs(backupPath) {
        console.log('📋 Backing up logs...');
        
        const logsDir = path.join(backupPath, 'logs');
        fs.mkdirSync(logsDir, { recursive: true });
        
        const logSources = [
            path.join(__dirname, '..', 'logs'),
            path.join(__dirname, '..', 'backend', 'logs'),
            path.join(__dirname, '..', 'frontend', 'logs')
        ];
        
        for (const logSource of logSources) {
            if (fs.existsSync(logSource)) {
                const files = fs.readdirSync(logSource);
                for (const file of files) {
                    const sourcePath = path.join(logSource, file);
                    const targetPath = path.join(logsDir, file);
                    fs.copyFileSync(sourcePath, targetPath);
                }
            }
        }
        
        console.log('  ✅ Logs backup completed');
    }

    async createManifest(backupPath) {
        const manifest = {
            timestamp: this.timestamp,
            date: new Date().toISOString(),
            version: '2.0.0',
            type: 'full-backup',
            components: {
                configurations: true,
                database: fs.existsSync(path.join(backupPath, 'database')),
                uploads: fs.existsSync(path.join(backupPath, 'uploads')),
                logs: fs.existsSync(path.join(backupPath, 'logs'))
            },
            system: {
                platform: process.platform,
                node_version: process.version,
                cwd: process.cwd()
            },
            files: this.getBackupContents(backupPath)
        };
        
        fs.writeFileSync(
            path.join(backupPath, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        console.log('📄 Backup manifest created');
    }

    async createArchive(backupPath, backupName) {
        console.log('🗜️  Creating compressed archive...');
        
        const archivePath = path.join(this.backupDir, `${backupName}.tar.gz`);
        
        try {
            execSync(`tar -czf "${archivePath}" -C "${this.backupDir}" "${backupName}"`, { stdio: 'inherit' });
            return archivePath;
        } catch (error) {
            // Fallback to ZIP if tar is not available
            try {
                const zipPath = path.join(this.backupDir, `${backupName}.zip`);
                execSync(`powershell Compress-Archive -Path "${backupPath}" -DestinationPath "${zipPath}"`, { stdio: 'inherit' });
                return zipPath;
            } catch (zipError) {
                console.log('  ⚠️  Archive creation failed, keeping directory backup');
                return backupPath;
            }
        }
    }

    copyDirectory(source, target) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }
        
        const files = fs.readdirSync(source);
        for (const file of files) {
            const sourcePath = path.join(source, file);
            const targetPath = path.join(target, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, targetPath);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }

    cleanupDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    }

    getFileSize(filePath) {
        if (!fs.existsSync(filePath)) return '0 B';
        
        const stats = fs.statSync(filePath);
        const bytes = stats.size;
        
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getBackupContents(backupPath) {
        const contents = [];
        
        function scan(dir, relativePath = '') {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const relativeFilePath = path.join(relativePath, file);
                
                if (fs.statSync(filePath).isDirectory()) {
                    scan(filePath, relativeFilePath);
                } else {
                    contents.push({
                        path: relativeFilePath,
                        size: fs.statSync(filePath).size,
                        modified: fs.statSync(filePath).mtime
                    });
                }
            }
        }
        
        scan(backupPath);
        return contents;
    }
}

// Run backup if called directly
if (require.main === module) {
    const backup = new BackupManager();
    backup.createBackup().catch(console.error);
}

module.exports = BackupManager;