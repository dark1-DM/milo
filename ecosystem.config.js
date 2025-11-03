module.exports = {
  apps: [
    {
      name: 'discord-bot-dashboard-prod',
      script: 'server/production.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart settings
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', 'frontend/build'],
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory management
      max_memory_restart: '1G',
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Environment
      env_file: '.env.production'
    },
    {
      name: 'discord-bot',
      script: 'bot/index.js',
      instances: 1, // Bot should run as single instance
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      // Logging
      log_file: 'logs/bot-combined.log',
      out_file: 'logs/bot-out.log',
      error_file: 'logs/bot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart settings
      watch: false,
      max_restarts: 5,
      min_uptime: '30s',
      
      // Memory management
      max_memory_restart: '512M',
      
      // Environment
      env_file: '.env.production'
    }
  ]
};