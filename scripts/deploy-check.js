const fs = require('fs');
const path = require('path');

console.log('🔍 Milo - Deployment Check');
console.log('================================================');

// Check if production build exists
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
const buildExists = fs.existsSync(buildPath);

console.log(`✅ Frontend Build: ${buildExists ? 'EXISTS' : '❌ MISSING'}`);

if (buildExists) {
  const buildFiles = fs.readdirSync(buildPath);
  console.log(`📦 Build files: ${buildFiles.length} files found`);
  
  // Check for essential files
  const essentialFiles = ['index.html', 'static'];
  essentialFiles.forEach(file => {
    const exists = buildFiles.includes(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });
}

// Check environment files
const envFiles = ['.env.production', 'frontend/.env.production'];
envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, '..', envFile);
  const exists = fs.existsSync(envPath);
  console.log(`${exists ? '✅' : '❌'} Environment file: ${envFile}`);
});

// Check server files
const serverFiles = ['server/production.js', 'server/index.js'];
serverFiles.forEach(serverFile => {
  const serverPath = path.join(__dirname, '..', serverFile);
  const exists = fs.existsSync(serverPath);
  console.log(`${exists ? '✅' : '❌'} Server file: ${serverFile}`);
});

// Check package.json scripts
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasProductionScript = packageJson.scripts['start:prod'] !== undefined;
  console.log(`${hasProductionScript ? '✅' : '❌'} Production script available`);
}

console.log('\n🚀 Deployment Checklist:');
console.log('========================');
console.log('1. Update .env.production with your actual values');
console.log('2. Update frontend/.env.production with your API URL');
console.log('3. Set up MongoDB production database');
console.log('4. Configure Discord bot application');
console.log('5. Set up Stripe account (for payments)');
console.log('6. Configure domain and SSL certificate');
console.log('7. Set up reverse proxy (nginx/Apache)');
console.log('8. Configure process manager (PM2)');

console.log('\n📋 Quick Start Commands:');
console.log('========================');
console.log('npm run prod:setup   # Install deps and build');
console.log('npm run prod:start   # Start production server');
console.log('npm run deploy:check # Run this check again');

console.log('\n✨ Ready for deployment!');