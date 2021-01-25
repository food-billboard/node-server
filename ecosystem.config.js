module.exports = {
  name: "app",
  // script: "./app.js",
  apps : [
    {
      name: 'app',
      script: 'app.js',
      // watch: '.',
      env: {
        NODE_ENV: "production"
      },
      exec_mode: "cluster_mode"
    }, 
    {
      name: 'media',
      script: 'media.js',
      exec_mode: "cluster_mode"
    }
  ],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
