module.exports = {
  name: "app",
  apps : [
    {
      name: 'app',
      script: 'app.js',
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
      key: "~/.ssh/id_rsa",
      user: "root",
      host: "47.111.229.250",
      ssh_options: "StrictHostKeyChecking=no",
      ref: "master",
      repo: "git@github.com:food-billboard/node-server.git",
      // repo: "https://github.com.cnpmjs.org/food-billboard/node-server",
      path: "/home/server",
      "post-deploy":
        "git pull origin master && source ~/.nvm/nvm.sh && npm install", //&& pm2 startOrRestart pm2.config.js 
      "env"  : {
        "NODE_ENV": "production"
      }
    }
  }
};