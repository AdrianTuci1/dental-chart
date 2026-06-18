const path = require('path');

const currentDir = process.env.PIXTOOTH_CURRENT_DIR || __dirname;
const sharedLogDir = process.env.PIXTOOTH_SHARED_LOG_DIR || path.join(currentDir, 'logs');

module.exports = {
  apps: [
    {
      name: 'pixtooth-backend',
      cwd: currentDir,
      script: 'app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3100',
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3100',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: path.join(sharedLogDir, 'err.log'),
      out_file: path.join(sharedLogDir, 'out.log'),
      merge_logs: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 10000,
      autorestart: true,
    },
  ],
};
