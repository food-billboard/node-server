const Client = require("ssh2-sftp-client");
const fs = require("fs-extra");
const path = require("path");
const { mergeWith } = require("lodash");
const chalk = require('chalk')

// ../node-server/scripts/publishLocalFile.js

function getBaseConfig() {
  try {
    return fs.readJSONSync(path.join(__dirname, "deploy.config.json"));
  } catch (err) {
    return {};
  }
}

function getCustomConfig() {
  try {
    return fs.readJSONSync(path.join(process.cwd(), "deploy.config.json"));
  } catch (err) {
    return {};
  }
}

function getConfig() {
  function mergeWithCallback(objValue, srcValue) {
    console.log(objValue, srcValue);
    if (typeof objValue === "object" && typeof srcValue === "object") {
      return mergeWith(objValue, srcValue, mergeWithCallback);
    }
    return srcValue;
  }
  return mergeWith(getBaseConfig(), getCustomConfig(), mergeWithCallback);
}

async function removeRemotePath(ssh, path) {
  const remotePathExists = await ssh.exists(path)
  if(remotePathExists) await ssh.rmdir(path, true)
}

async function deploy() {
  const config = getConfig();
  const {
    localPath,
    remotePath,
    connectOptions: {
      port=22,
      username,
      password,
      host,
    }={},
  } = config 

  const ssh = new Client()

  try {
    // 连接
    await ssh.connect({
      host,
      port,
      username,
      password,
    })

    // 先上传到临时目录再改名
    const templateRemotePath = remotePath + '__template'
    removeRemotePath(templateRemotePath)

    // 创建临时目录
    await ssh.mkdir(templateRemotePath)

    // 上传本地文件到临时目录
    await ssh.uploadDir(localPath, templateRemotePath)

    // 删除服务器原目录
    await ssh.rmdir(remotePath)

    // 将临时目录更改为实际目录
    await ssh.rename(templateRemotePath, remotePath)

    console.log(chalk.green('upload success!'))

  }catch(err) {
    console.error(err)
    process.exit(0)
  }



}

module.exports = deploy;
