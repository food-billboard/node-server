module.exports = {
  name: "app",
  apps : [
    {
      name: 'app',
      script: 'app.js',
      env: {
        NODE_ENV: "production"
      },
      exec_mode: "cluster_mode",
      error_file: './src/logs/pm2/error.log',
      out_file: './src/logs/pm2/output.log'
    }, 
    {
      name: 'media',
      script: 'media.js',
      exec_mode: "cluster_mode"
    },
    {
      name: "socket",
      script: "./src/chat/index.js",
      exec_mode: "cluster_mode",
    }
  ],

  deploy : {
    production : {
      user: "root",
      host: "47.97.27.23",
      ssh_options: "StrictHostKeyChecking=no",
      ref: "master",
      repo: "git@github.com:food-billboard/node-server.git",
      // repo: "https://github.com/food-billboard/node-server.git",
      path: "/home",
      "post-deploy":
        "git pull origin master && source ~/.nvm/nvm.sh && npm install yarn -g && yarn install", //&& pm2 startOrRestart pm2.config.js 
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
};