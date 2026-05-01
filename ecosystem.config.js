module.exports = {
  apps: [
    {
      name: 'dato-click-dashboard',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 8080',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      }
    }
  ]
};
