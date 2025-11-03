#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class RestoreManager {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async startRestore() {
        console.log('🔄 Milo Restore Manager\n');
        
        try {
            const backups = await this.listAvailableBackups();
            
            if (backups.length === 0) {
                console.log('❌ No backups found in the backups directory.');
                return;
            }
            
            const selectedBackup = await this.selectBackup(backups);
            const manifest = await this.loadManifest(selectedBackup);
            
            if (manifest) {
                await this.displayBackupInfo(manifest);
                const confirmed = await this.confirmRestore();
                
                if (confirmed) {
                    await this.performRestore(selectedBackup, manifest);
                } else {
                    console.log('Restore cancelled.');
                }
            } else {
                console.log('⚠️  No manifest found, attempting basic restore...');
                const confirmed = await this.confirmRestore();
                if (confirmed) {
                    await this.performBasicRestore(selectedBackup);
                }
            }
            
        } catch (error) {
            console.error('❌ Restore failed:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async listAvailableBackups() {
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }
        
        const files = fs.readdirSync(this.backupDir);
        const backups = [];
        
        for (const file of files) {
            const filePath = path.join(this.backupDir, file);
            const stats = fs.statSync(filePath);
            
            if (file.includes('discord-bot-backup')) {
                backups.push({
                    name: file,
                    path: filePath,
                    size: this.getFileSize(filePath),
                    date: stats.mtime,
                    isArchive: file.endsWith('.tar.gz') || file.endsWith('.zip'),
                    isDirectory: stats.isDirectory()
                });
            }
        }
        
        return backups.sort((a, b) => b.date - a.date);
    }

    async selectBackup(backups) {
        console.log('Available backups:');
        console.log('==================');
        
        backups.forEach((backup, index) => {
            const type = backup.isArchive ? '📦' : '📁';
            const date = backup.date.toLocaleString();
            console.log(`${index + 1}. ${type} ${backup.name}`);
            console.log(`   📅 ${date} | 💾 ${backup.size}`);
            console.log('');
        });
        
        const answer = await this.question('Select backup to restore (number): ');
        const selection = parseInt(answer) - 1;
        
        if (selection < 0 || selection >= backups.length) {
            throw new Error('Invalid selection');
        }
        
        return backups[selection];
    }

    async loadManifest(backup) {
        let manifestPath;
        
        if (backup.isArchive) {
            // Extract archive first
            const tempDir = await this.extractArchive(backup);
            manifestPath = path.join(tempDir, 'manifest.json');
        } else {
            manifestPath = path.join(backup.path, 'manifest.json');
        }
        
        if (fs.existsSync(manifestPath)) {
            return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }
        
        return null;
    }

    async extractArchive(backup) {
        console.log('📦 Extracting archive...');
        
        const tempDir = path.join(this.backupDir, 'temp-restore');
        
        // Clean up any existing temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        
        fs.mkdirSync(tempDir, { recursive: true });
        
        try {
            if (backup.name.endsWith('.tar.gz')) {
                execSync(`tar -xzf "${backup.path}" -C "${tempDir}"`, { stdio: 'inherit' });
            } else if (backup.name.endsWith('.zip')) {
                execSync(`powershell Expand-Archive -Path "${backup.path}" -DestinationPath "${tempDir}"`, { stdio: 'inherit' });
            }
            
            // Find the extracted directory
            const files = fs.readdirSync(tempDir);
            const extractedDir = files.find(file => {
                const filePath = path.join(tempDir, file);
                return fs.statSync(filePath).isDirectory();
            });
            
            if (extractedDir) {
                return path.join(tempDir, extractedDir);
            } else {
                return tempDir;
            }
            
        } catch (error) {
            throw new Error(`Failed to extract archive: ${error.message}`);
        }
    }

    async displayBackupInfo(manifest) {
        console.log('\n📋 Backup Information:');
        console.log('======================');
        console.log(`📅 Date: ${new Date(manifest.date).toLocaleString()}`);
        console.log(`🏷️  Version: ${manifest.version}`);
        console.log(`🔧 Type: ${manifest.type}`);
        console.log(`💻 Platform: ${manifest.system?.platform || 'Unknown'}`);
        console.log(`⚡ Node Version: ${manifest.system?.node_version || 'Unknown'}`);
        
        console.log('\n📦 Components:');
        const components = manifest.components || {};
        console.log(`  Configuration files: ${components.configurations ? '✅' : '❌'}`);
        console.log(`  Database: ${components.database ? '✅' : '❌'}`);
        console.log(`  Uploads: ${components.uploads ? '✅' : '❌'}`);
        console.log(`  Logs: ${components.logs ? '✅' : '❌'}`);
        
        if (manifest.files) {
            console.log(`\n📊 Files: ${manifest.files.length} items`);
        }
        
        console.log('');
    }

    async confirmRestore() {
        const answer = await this.question('⚠️  This will overwrite existing files. Continue? (y/N): ');
        return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    }

    async performRestore(backup, manifest) {
        console.log('🔄 Starting restore process...\n');
        
        let restorePath;
        
        if (backup.isArchive) {
            restorePath = await this.extractArchive(backup);
        } else {
            restorePath = backup.path;
        }
        
        try {
            // Create backup of current state
            await this.createCurrentBackup();
            
            // Restore configurations
            if (manifest.components?.configurations) {
                await this.restoreConfigurations(restorePath);
            }
            
            // Restore database
            if (manifest.components?.database) {
                await this.restoreDatabase(restorePath);
            }
            
            // Restore uploads
            if (manifest.components?.uploads) {
                await this.restoreUploads(restorePath);
            }
            
            // Restore logs
            if (manifest.components?.logs) {
                await this.restoreLogs(restorePath);
            }
            
            console.log('\n✅ Restore completed successfully!');
            console.log('🔄 Please restart your application to apply changes.');
            
        } catch (error) {
            console.error('❌ Restore failed:', error.message);
            console.log('💡 Your current backup is available in backups/current-backup-*');
        } finally {
            // Clean up temp directory
            if (backup.isArchive) {
                const tempDir = path.dirname(restorePath);
                if (tempDir.includes('temp-restore')) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            }
        }
    }

    async performBasicRestore(backup) {
        console.log('🔄 Starting basic restore process...\n');
        
        let restorePath;
        
        if (backup.isArchive) {
            restorePath = await this.extractArchive(backup);
        } else {
            restorePath = backup.path;
        }
        
        try {
            // Create backup of current state
            await this.createCurrentBackup();
            
            // Restore all files found
            await this.restoreAllFiles(restorePath);
            
            console.log('\n✅ Basic restore completed!');
            console.log('🔄 Please restart your application to apply changes.');
            
        } catch (error) {
            console.error('❌ Restore failed:', error.message);
        } finally {
            // Clean up temp directory
            if (backup.isArchive) {
                const tempDir = path.dirname(restorePath);
                if (tempDir.includes('temp-restore')) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            }
        }
    }

    async createCurrentBackup() {
        console.log('💾 Creating backup of current state...');
        
        const BackupManager = require('./backup.js');
        const backup = new BackupManager();
        
        try {
            await backup.createBackup();
            console.log('  ✅ Current state backed up');
        } catch (error) {
            console.log('  ⚠️  Failed to backup current state:', error.message);
        }
    }

    async restoreConfigurations(restorePath) {
        console.log('📝 Restoring configuration files...');
        
        const configDir = path.join(restorePath, 'config');
        if (!fs.existsSync(configDir)) {
            console.log('  ⚠️  No config directory found');
            return;
        }
        
        const files = fs.readdirSync(configDir);
        const rootDir = path.join(__dirname, '..');
        
        for (const file of files) {
            const sourcePath = path.join(configDir, file);
            const targetFile = file.replace(/_/g, '/');
            const targetPath = path.join(rootDir, targetFile);
            
            // Create target directory if needed
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`  ✅ ${targetFile}`);
        }
    }

    async restoreDatabase(restorePath) {
        console.log('💾 Restoring database...');
        
        const dbDir = path.join(restorePath, 'database', 'mongodb-dump');
        if (!fs.existsSync(dbDir)) {
            console.log('  ⚠️  No database backup found');
            return;
        }
        
        // Check if .env exists to get database URI
        const envPath = path.join(__dirname, '..', 'backend', '.env');
        if (!fs.existsSync(envPath)) {
            console.log('  ⚠️  No .env file found, cannot restore database');
            return;
        }
        
        const envContent = fs.readFileSync(envPath, 'utf8');
        const mongoUri = envContent.match(/MONGODB_URI=(.+)/);
        
        if (mongoUri) {
            try {
                execSync(`mongorestore --uri="${mongoUri[1]}" --drop "${dbDir}"`, { stdio: 'inherit' });
                console.log('  ✅ Database restore completed');
            } catch (error) {
                console.log('  ❌ Database restore failed:', error.message);
            }
        } else {
            console.log('  ⚠️  No MongoDB URI found, cannot restore database');
        }
    }

    async restoreUploads(restorePath) {
        console.log('📁 Restoring uploaded files...');
        
        const uploadsSource = path.join(restorePath, 'uploads');
        if (!fs.existsSync(uploadsSource)) {
            console.log('  ⚠️  No uploads backup found');
            return;
        }
        
        const uploadsTarget = path.join(__dirname, '..', 'backend', 'uploads');
        
        // Remove existing uploads
        if (fs.existsSync(uploadsTarget)) {
            fs.rmSync(uploadsTarget, { recursive: true, force: true });
        }
        
        this.copyDirectory(uploadsSource, uploadsTarget);
        console.log('  ✅ Uploads restore completed');
    }

    async restoreLogs(restorePath) {
        console.log('📋 Restoring logs...');
        
        const logsSource = path.join(restorePath, 'logs');
        if (!fs.existsSync(logsSource)) {
            console.log('  ⚠️  No logs backup found');
            return;
        }
        
        const logTargets = [
            path.join(__dirname, '..', 'logs'),
            path.join(__dirname, '..', 'backend', 'logs'),
            path.join(__dirname, '..', 'frontend', 'logs')
        ];
        
        const files = fs.readdirSync(logsSource);
        
        for (const logTarget of logTargets) {
            if (!fs.existsSync(logTarget)) {
                fs.mkdirSync(logTarget, { recursive: true });
            }
            
            for (const file of files) {
                const sourcePath = path.join(logsSource, file);
                const targetPath = path.join(logTarget, file);
                
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                }
            }
        }
        
        console.log('  ✅ Logs restore completed');
    }

    async restoreAllFiles(restorePath) {
        console.log('📁 Restoring all files...');
        
        const rootDir = path.join(__dirname, '..');
        this.copyDirectory(restorePath, rootDir, ['manifest.json']);
        
        console.log('  ✅ All files restored');
    }

    copyDirectory(source, target, excludeFiles = []) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }
        
        const files = fs.readdirSync(source);
        
        for (const file of files) {
            if (excludeFiles.includes(file)) continue;
            
            const sourcePath = path.join(source, file);
            const targetPath = path.join(target, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, targetPath, excludeFiles);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
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

    question(query) {
        return new Promise(resolve => {
            this.rl.question(query, resolve);
        });
    }
}

// Run restore if called directly
if (require.main === module) {
    const restore = new RestoreManager();
    restore.startRestore().catch(console.error);
}

module.exports = RestoreManager;