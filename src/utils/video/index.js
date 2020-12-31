const { createHls } = require('./ffmpeg')
const chalk = require('chalk')
  
//重定向
//生成视频流
const createHlsVideo = async (ctx, filePath) => {

  try {
    const path = await createHls(filePath)
    ctx.status = 301
    ctx.redirect(path)
  }catch(err) {
    console.log(chalk.red('read video path error: ', JSON.stringify(err)))
    ctx.status = 404
  }

}

module.exports = {
  createHlsVideo
}