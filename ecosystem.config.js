// ==============================================================================
// PM2 Process Manager Configuration - Verified Labour
// ==============================================================================
// Usage on VPS:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 reload verified-labour
//
// ISOLATION GUARANTEE:
//   This configuration binds strictly to port 3001.
//   It will NEVER collide with or affect EduConnects running on port 3000.
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'verified-labour',
      cwd: '/var/www/verifiedlabour',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 'max', // Utilizes all available CPU cores in cluster mode
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/verified-labour-error.log',
      out_file: '/var/log/pm2/verified-labour-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
