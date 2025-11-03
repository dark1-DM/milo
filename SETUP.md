# Discord Bot Dashboard - Quick Start Guide

## 🚀 Quick Setup

### 1. Clone or Download
Download this project to your computer.

### 2. Install Dependencies
**Windows:**
```bash
# Run the install script
install.bat
```

**Linux/Mac:**
```bash
# Make the script executable and run it
chmod +x install.sh
./install.sh
```

**Manual Installation:**
```bash
# Install bot dependencies
npm install

# Install dashboard dependencies
cd dashboard
npm install
```

### 3. Set Up Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Discord bot credentials:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/discord-bot

# Web Dashboard
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_session_secret_here
DASHBOARD_URL=http://localhost:3000
BOT_API_URL=http://localhost:5000
```

### 4. Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name and create
4. Go to "Bot" section:
   - Copy the Token (DISCORD_BOT_TOKEN)
   - Enable all Privileged Gateway Intents
5. Go to "OAuth2" section:
   - Copy Client ID (DISCORD_CLIENT_ID)
   - Copy Client Secret (DISCORD_CLIENT_SECRET)
   - Add redirect URI: `http://localhost:3000/auth/callback`
   - Select scopes: `bot`, `applications.commands`
   - Select bot permissions: `Administrator` (or specific permissions)

### 5. Install MongoDB (Optional)

If you don't have MongoDB installed:

**Windows:**
- Download from https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
```

**Mac:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### 6. Start the Applications

**Terminal 1 - Start Bot:**
```bash
npm start
```

**Terminal 2 - Start Dashboard:**
```bash
cd dashboard
npm start
```

### 7. Add Bot to Server

1. Go to Discord Developer Portal
2. Go to OAuth2 > URL Generator
3. Select scopes: `bot`, `applications.commands`
4. Select permissions: `Administrator`
5. Copy the generated URL and open it in browser
6. Select your server and authorize

### 8. Access Dashboard

1. Open http://localhost:3000
2. Click "Login with Discord"
3. Authorize the application
4. Select your server to manage

## 🎯 Default Commands

### Slash Commands
- `/help` - Show all commands
- `/play <song>` - Play music
- `/ban @user` - Ban a user
- `/kick @user` - Kick a user
- `/serverinfo` - Server information
- `/8ball <question>` - Magic 8-ball

### Prefix Commands (default: `!`)
- `!ping` - Check bot latency
- `!clear <amount>` - Delete messages
- `!roll <dice>` - Roll dice (e.g., !roll 2d6)

## 🔧 Configuration

### Change Bot Prefix
1. Use `/setup` command in Discord
2. Or change it in the web dashboard
3. Or directly in database

### Enable Features
- **Auto-Moderation**: Dashboard > Moderation > Auto-Mod
- **Music**: Dashboard > Music > Settings
- **Welcome Messages**: Dashboard > Settings > Welcome
- **Reaction Roles**: Dashboard > Fun > Reaction Roles

## 📊 Dashboard Features

- **Server Overview**: Statistics and general info
- **Moderation**: Ban/kick logs, auto-mod settings
- **Music**: Queue management, volume control
- **Fun Commands**: Games, entertainment features
- **Settings**: Prefix, language, general config
- **Analytics**: Usage stats, member activity

## 🛠️ Troubleshooting

### Bot Not Responding
1. Check if bot token is correct
2. Ensure bot has necessary permissions
3. Check console for errors
4. Verify intents are enabled

### Dashboard Login Issues
1. Check Discord client ID/secret
2. Verify redirect URI in Discord app
3. Check if API server is running on port 5000

### Music Not Working
1. Ensure bot is in voice channel
2. Check if ffmpeg is installed
3. Verify voice permissions

### Database Errors
1. Make sure MongoDB is running
2. Check connection string
3. Verify database permissions

## 🔗 Useful Links

- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://reactjs.org/docs)

## 🎉 You're Ready!

Your Discord bot dashboard is now set up and ready to use. Enjoy managing your Discord server with this powerful tool!