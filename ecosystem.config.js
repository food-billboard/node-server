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
      host: ["47.111.229.250"],
      ssh_options: "StrictHostKeyChecking=no",
      ref: "origin/master",
      repo: "git@github.com:food-billboard/node-server.git",
      path: "/home/node-server",
      "post-deploy":
        "source ~/.nvm/nvm.sh && yarn install && pm2 startOrRestart ecosystem.config.js",
    }
  }
};
