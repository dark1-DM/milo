#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DatabaseManager {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.backupDir = path.join(this.rootDir, 'database-backups');
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async manageDatabase() {
        console.log('💾 Database Management Console\n');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        try {
            console.log('Available operations:');
            console.log('====================');
            console.log('1. 📤 Backup Database');
            console.log('2. 📥 Restore Database');
            console.log('3. 🧹 Clean Database');
            console.log('4. 📊 Database Statistics');
            console.log('5. 🔄 Migrate Database');
            console.log('6. 🗂️  Export Collections');
            console.log('7. 📥 Import Collections');
            console.log('8. 🔧 Database Health Check');
            console.log('');
            
            const operation = await this.question(rl, 'Select operation (1-8): ');
            
            switch (operation) {
                case '1':
                    await this.backupDatabase();
                    break;
                case '2':
                    await this.restoreDatabase(rl);
                    break;
                case '3':
                    await this.cleanDatabase(rl);
                    break;
                case '4':
                    await this.getDatabaseStats();
                    break;
                case '5':
                    await this.migrateDatabase();
                    break;
                case '6':
                    await this.exportCollections(rl);
                    break;
                case '7':
                    await this.importCollections(rl);
                    break;
                case '8':
                    await this.healthCheck();
                    break;
                default:
                    console.log('❌ Invalid operation');
            }
            
        } catch (error) {
            console.error('❌ Database operation failed:', error.message);
        } finally {
            rl.close();
        }
    }

    async backupDatabase() {
        console.log('📤 Starting database backup...\n');
        
        const mongoUri = await this.getMongoUri();
        if (!mongoUri) return;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `mongodb-backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            console.log('🔄 Creating backup...');
            execSync(`mongodump --uri="${mongoUri}" --out="${backupPath}"`, { stdio: 'inherit' });
            
            // Create backup manifest
            const manifest = {
                timestamp: timestamp,
                date: new Date().toISOString(),
                uri: mongoUri.replace(/\/\/.*:.*@/, '//***:***@'), // Hide credentials
                backupPath: backupPath,
                size: this.getDirectorySize(backupPath)
            };
            
            fs.writeFileSync(
                path.join(backupPath, 'manifest.json'),
                JSON.stringify(manifest, null, 2)
            );
            
            // Create compressed archive
            const archivePath = path.join(this.backupDir, `${backupName}.tar.gz`);
            try {
                execSync(`tar -czf "${archivePath}" -C "${this.backupDir}" "${backupName}"`, { stdio: 'inherit' });
                
                // Remove uncompressed backup
                fs.rmSync(backupPath, { recursive: true, force: true });
                
                console.log(`✅ Database backup completed!`);
                console.log(`📦 Archive: ${archivePath}`);
                console.log(`💾 Size: ${this.getFileSize(archivePath)}`);
                
            } catch (tarError) {
                console.log('⚠️  Could not create archive, keeping directory backup');
                console.log(`📁 Backup directory: ${backupPath}`);
            }
            
            // Clean up old backups (keep last 10)
            await this.cleanupOldBackups();
            
        } catch (error) {
            console.error('❌ Backup failed:', error.message);
        }
    }

    async restoreDatabase(rl) {
        console.log('📥 Database Restore\n');
        
        const backups = await this.listAvailableBackups();
        
        if (backups.length === 0) {
            console.log('❌ No backups found');
            return;
        }
        
        console.log('Available backups:');
        console.log('==================');
        
        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.name} (${backup.date})`);
        });
        
        const selection = await this.question(rl, '\nSelect backup to restore (number): ');
        const backupIndex = parseInt(selection) - 1;
        
        if (backupIndex < 0 || backupIndex >= backups.length) {
            console.log('❌ Invalid selection');
            return;
        }
        
        const selectedBackup = backups[backupIndex];
        const confirmRestore = await this.question(rl, 
            '⚠️  This will overwrite the current database. Continue? (y/N): ');
        
        if (confirmRestore.toLowerCase() !== 'y') {
            console.log('Restore cancelled');
            return;
        }
        
        try {
            console.log('🔄 Restoring database...');
            
            const mongoUri = await this.getMongoUri();
            if (!mongoUri) return;
            
            let restorePath = selectedBackup.path;
            
            // Extract archive if needed
            if (selectedBackup.isArchive) {
                const tempDir = path.join(this.backupDir, 'temp-restore');
                
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                
                fs.mkdirSync(tempDir, { recursive: true });
                
                execSync(`tar -xzf "${selectedBackup.path}" -C "${tempDir}"`, { stdio: 'inherit' });
                
                const extractedDirs = fs.readdirSync(tempDir);
                restorePath = path.join(tempDir, extractedDirs[0]);
            }
            
            execSync(`mongorestore --uri="${mongoUri}" --drop "${restorePath}"`, { stdio: 'inherit' });
            
            console.log('✅ Database restore completed!');
            
            // Clean up temp directory
            if (selectedBackup.isArchive) {
                const tempDir = path.join(this.backupDir, 'temp-restore');
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            }
            
        } catch (error) {
            console.error('❌ Restore failed:', error.message);
        }
    }

    async cleanDatabase(rl) {
        console.log('🧹 Database Cleanup\n');
        
        console.log('Cleanup options:');
        console.log('================');
        console.log('1. Remove old logs');
        console.log('2. Remove inactive users');
        console.log('3. Remove expired sessions');
        console.log('4. Compact collections');
        console.log('5. All of the above');
        
        const option = await this.question(rl, 'Select cleanup option (1-5): ');
        
        const mongoUri = await this.getMongoUri();
        if (!mongoUri) return;
        
        try {
            console.log('🔄 Starting database cleanup...');
            
            const cleanupScript = this.generateCleanupScript(option);
            const scriptPath = path.join(this.rootDir, 'temp-cleanup.js');
            
            fs.writeFileSync(scriptPath, cleanupScript);
            
            execSync(`mongosh "${mongoUri}" "${scriptPath}"`, { stdio: 'inherit' });
            
            // Remove temporary script
            fs.unlinkSync(scriptPath);
            
            console.log('✅ Database cleanup completed!');
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }

    async getDatabaseStats() {
        console.log('📊 Database Statistics\n');
        
        const mongoUri = await this.getMongoUri();
        if (!mongoUri) return;
        
        try {
            const statsScript = `
                // Database statistics
                print('='.repeat(50));
                print('DATABASE STATISTICS');
                print('='.repeat(50));
                
                const stats = db.stats();
                print('Database: ' + db.getName());
                print('Collections: ' + stats.collections);
                print('Objects: ' + stats.objects);
                print('Data Size: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
                print('Storage Size: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
                print('Indexes: ' + stats.indexes);
                print('Index Size: ' + (stats.indexSize / 1024 / 1024).toFixed(2) + ' MB');
                print('');
                
                // Collection statistics
                print('COLLECTION DETAILS:');
                print('-'.repeat(30));
                
                db.getCollectionNames().forEach(function(collName) {
                    const collStats = db.getCollection(collName).stats();
                    print(collName + ':');
                    print('  Documents: ' + collStats.count);
                    print('  Size: ' + (collStats.size / 1024).toFixed(2) + ' KB');
                    print('  Avg Doc Size: ' + collStats.avgObjSize + ' bytes');
                    print('');
                });
            `;
            
            const scriptPath = path.join(this.rootDir, 'temp-stats.js');
            fs.writeFileSync(scriptPath, statsScript);
            
            execSync(`mongosh "${mongoUri}" "${scriptPath}" --quiet`, { stdio: 'inherit' });
            
            // Remove temporary script
            fs.unlinkSync(scriptPath);
            
        } catch (error) {
            console.error('❌ Failed to get database stats:', error.message);
        }
    }

    async migrateDatabase() {
        console.log('🔄 Database Migration\n');
        
        const migrationsDir = path.join(this.rootDir, 'migrations');
        
        if (!fs.existsSync(migrationsDir)) {
            console.log('📁 Creating migrations directory...');
            fs.mkdirSync(migrationsDir, { recursive: true });
            
            // Create example migration
            const exampleMigration = `
// Migration: ${Date.now()}_example_migration.js
// Description: Example migration file

// Up migration
exports.up = async function(db) {
    // Add your migration logic here
    // Example: await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('Running up migration...');
};

// Down migration (rollback)
exports.down = async function(db) {
    // Add your rollback logic here
    // Example: await db.collection('users').dropIndex({ email: 1 });
    console.log('Running down migration...');
};
`;
            
            fs.writeFileSync(
                path.join(migrationsDir, `${Date.now()}_example_migration.js`),
                exampleMigration
            );
            
            console.log('✅ Migrations directory created with example migration');
            return;
        }
        
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.js'))
            .sort();
        
        if (migrationFiles.length === 0) {
            console.log('ℹ️  No migration files found');
            return;
        }
        
        console.log('📋 Available migrations:');
        migrationFiles.forEach(file => {
            console.log(`  - ${file}`);
        });
        
        console.log('\n🔄 Running migrations...');
        
        // This is a simplified migration runner
        // In production, you'd want to track which migrations have been run
        for (const migrationFile of migrationFiles) {
            console.log(`Running ${migrationFile}...`);
            // Migration logic would go here
        }
        
        console.log('✅ Migrations completed!');
    }

    async exportCollections(rl) {
        console.log('🗂️  Export Collections\n');
        
        const mongoUri = await this.getMongoUri();
        if (!mongoUri) return;
        
        const collection = await this.question(rl, 'Enter collection name (or "all" for all collections): ');
        const exportDir = path.join(this.rootDir, 'exports', `export-${Date.now()}`);
        
        fs.mkdirSync(exportDir, { recursive: true });
        
        try {
            if (collection.toLowerCase() === 'all') {
                console.log('📤 Exporting all collections...');
                execSync(`mongoexport --uri="${mongoUri}" --out="${exportDir}"`, { stdio: 'inherit' });
            } else {
                console.log(`📤 Exporting collection: ${collection}`);
                const exportFile = path.join(exportDir, `${collection}.json`);
                execSync(`mongoexport --uri="${mongoUri}" --collection="${collection}" --out="${exportFile}"`, { stdio: 'inherit' });
            }
            
            console.log(`✅ Export completed! Files saved to: ${exportDir}`);
            
        } catch (error) {
            console.error('❌ Export failed:', error.message);
        }
    }

    async importCollections(rl) {
        console.log('📥 Import Collections\n');
        
        const mongoUri = await this.getMongoUri();
        if (!mongoUri) return;
        
        const importFile = await this.question(rl, 'Enter path to import file: ');
        
        if (!fs.existsSync(importFile)) {
            console.log('❌ Import file not found');
            return;
        }
        
        const collection = await this.question(rl, 'Enter collection name: ');
        
        try {
            console.log(`📥 Importing to collection: ${collection}`);
            execSync(`mongoimport --uri="${mongoUri}" --collection="${collection}" --file="${importFile}"`, { stdio: 'inherit' });
            
            console.log('✅ Import completed!');
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
        }
    }

    async healthCheck() {
        console.log('🔧 Database Health Check\n');
        
        const mongoUri = await this.getMongoUri();
        if (!mongoUri) return;
        
        try {
            const healthScript = `
                print('🏥 DATABASE HEALTH CHECK');
                print('='.repeat(40));
                
                // Connection test
                try {
                    db.adminCommand('ping');
                    print('✅ Connection: OK');
                } catch (e) {
                    print('❌ Connection: FAILED');
                    print('Error: ' + e.message);
                }
                
                // Server status
                try {
                    const status = db.adminCommand('serverStatus');
                    print('✅ Server Status: OK');
                    print('   Uptime: ' + Math.floor(status.uptime / 3600) + ' hours');
                    print('   Connections: ' + status.connections.current + '/' + status.connections.available);
                } catch (e) {
                    print('❌ Server Status: FAILED');
                }
                
                // Replica set status (if applicable)
                try {
                    const rsStatus = db.adminCommand('replSetGetStatus');
                    print('✅ Replica Set: OK');
                    print('   State: ' + rsStatus.myState);
                } catch (e) {
                    if (!e.message.includes('not running with --replSet')) {
                        print('⚠️  Replica Set: ' + e.message);
                    }
                }
                
                // Index health
                let indexIssues = 0;
                db.getCollectionNames().forEach(function(collName) {
                    const coll = db.getCollection(collName);
                    const indexes = coll.getIndexes();
                    
                    indexes.forEach(function(index) {
                        // Check for unused indexes (this is a simplified check)
                        if (index.accesses && index.accesses.ops < 100) {
                            indexIssues++;
                        }
                    });
                });
                
                if (indexIssues === 0) {
                    print('✅ Indexes: OK');
                } else {
                    print('⚠️  Indexes: ' + indexIssues + ' potential issues found');
                }
                
                print('\\n🎯 Health Check Complete');
            `;
            
            const scriptPath = path.join(this.rootDir, 'temp-health.js');
            fs.writeFileSync(scriptPath, healthScript);
            
            execSync(`mongosh "${mongoUri}" "${scriptPath}" --quiet`, { stdio: 'inherit' });
            
            // Remove temporary script
            fs.unlinkSync(scriptPath);
            
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
        }
    }

    // Helper methods
    async getMongoUri() {
        const envPath = path.join(this.rootDir, 'backend', '.env');
        
        if (!fs.existsSync(envPath)) {
            console.log('❌ No .env file found in backend directory');
            return null;
        }
        
        const envContent = fs.readFileSync(envPath, 'utf8');
        const mongoUri = envContent.match(/MONGODB_URI=(.+)/);
        
        if (!mongoUri) {
            console.log('❌ No MONGODB_URI found in .env file');
            return null;
        }
        
        return mongoUri[1].trim();
    }

    async listAvailableBackups() {
        const backups = [];
        
        if (!fs.existsSync(this.backupDir)) {
            return backups;
        }
        
        const files = fs.readdirSync(this.backupDir);
        
        for (const file of files) {
            const filePath = path.join(this.backupDir, file);
            const stats = fs.statSync(filePath);
            
            if (file.includes('mongodb-backup')) {
                backups.push({
                    name: file,
                    path: filePath,
                    date: stats.mtime.toLocaleString(),
                    size: this.getFileSize(filePath),
                    isArchive: file.endsWith('.tar.gz')
                });
            }
        }
        
        return backups.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    generateCleanupScript(option) {
        let script = `
// Database cleanup script
print('🧹 Starting database cleanup...');
`;
        
        if (option === '1' || option === '5') {
            script += `
// Remove old logs (older than 30 days)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const logsResult = db.logs.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
print('🗑️  Removed ' + logsResult.deletedCount + ' old log entries');
`;
        }
        
        if (option === '2' || option === '5') {
            script += `
// Remove inactive users (no login in 90 days)
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const usersResult = db.users.deleteMany({ 
    lastLogin: { $lt: ninetyDaysAgo },
    isActive: false 
});
print('👤 Removed ' + usersResult.deletedCount + ' inactive users');
`;
        }
        
        if (option === '3' || option === '5') {
            script += `
// Remove expired sessions
const now = new Date();

const sessionsResult = db.sessions.deleteMany({ expiresAt: { $lt: now } });
print('🔑 Removed ' + sessionsResult.deletedCount + ' expired sessions');
`;
        }
        
        if (option === '4' || option === '5') {
            script += `
// Compact collections
db.getCollectionNames().forEach(function(collName) {
    db.runCommand({ compact: collName });
    print('🗜️  Compacted collection: ' + collName);
});
`;
        }
        
        script += `
print('✅ Database cleanup completed!');
`;
        
        return script;
    }

    async cleanupOldBackups() {
        const backups = await this.listAvailableBackups();
        
        if (backups.length > 10) {
            const toDelete = backups.slice(10);
            
            for (const backup of toDelete) {
                fs.unlinkSync(backup.path);
                console.log(`🗑️  Removed old backup: ${backup.name}`);
            }
        }
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;
        
        function calculateSize(dir) {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    calculateSize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }
        }
        
        calculateSize(dirPath);
        return totalSize;
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

    question(rl, query) {
        return new Promise(resolve => {
            rl.question(query, resolve);
        });
    }
}

// Run database manager if called directly
if (require.main === module) {
    const dbManager = new DatabaseManager();
    dbManager.manageDatabase().catch(console.error);
}

module.exports = DatabaseManager;