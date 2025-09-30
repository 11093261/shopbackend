module.exports = {
  apps: [{
    name: 'shopbackend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3200
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3200
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    autorestart: true
  }]
};