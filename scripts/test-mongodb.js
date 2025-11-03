#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function testMongoConnection() {
    console.log('🔍 Testing MongoDB Atlas connection...\n');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.log('❌ No MONGODB_URI found in environment variables');
        process.exit(1);
    }
    
    console.log('📝 Connection URI:', mongoUri.replace(/\/\/.*:.*@/, '//***:***@'));
    
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            connectTimeoutMS: 10000
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Test database operations
        console.log('\n🔍 Testing database operations...');
        
        // Get database info
        const db = mongoose.connection.db;
        const admin = db.admin();
        
        const dbStats = await db.stats();
        console.log('📊 Database Stats:');
        console.log(`   Database: ${db.databaseName}`);
        console.log(`   Collections: ${dbStats.collections}`);
        console.log(`   Objects: ${dbStats.objects}`);
        console.log(`   Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Test write operation
        console.log('\n✍️  Testing write operation...');
        const testCollection = db.collection('connection_test');
        
        const testDoc = {
            test: true,
            timestamp: new Date(),
            message: 'MongoDB Atlas connection test successful!'
        };
        
        const insertResult = await testCollection.insertOne(testDoc);
        console.log('✅ Test document inserted:', insertResult.insertedId);
        
        // Test read operation
        console.log('📖 Testing read operation...');
        const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
        console.log('✅ Test document read:', readResult.message);
        
        // Clean up test document
        await testCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('🧹 Test document cleaned up');
        
        console.log('\n🎉 All MongoDB Atlas tests passed successfully!');
        console.log('🚀 Your database is ready for production use!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Tips for authentication issues:');
            console.log('   1. Verify username and password are correct');
            console.log('   2. Check if database user has proper permissions');
            console.log('   3. Ensure IP address is whitelisted in MongoDB Atlas');
        }
        
        if (error.message.includes('timeout')) {
            console.log('\n💡 Tips for timeout issues:');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify MongoDB Atlas cluster is running');
            console.log('   3. Check firewall settings');
        }
        
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
if (require.main === module) {
    testMongoConnection().catch(console.error);
}

module.exports = testMongoConnection;