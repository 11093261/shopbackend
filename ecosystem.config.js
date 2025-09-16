module.exports = {
  apps: [{
    name: 'shopbackend', 
    script: 'server.js', 
    instances: 'max',    
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3200
    },
    error_file: '/var/log/shopbackend/err.log',
    out_file: '/var/log/shopbackend/out.log',     
    log_file: '/var/log/shopbackend/combined.log',
    time: true
  }]
};