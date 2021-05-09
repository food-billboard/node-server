const chalk = require('chalk')
const fs = require('fs')
const Mime = require('mime')
const { createHls } = require('./ffmpeg')
  
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

//普通流式视频播放处理
async function videoDataParse(ctx, filePath) {
  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const mime = Mime.getType(filePath).toLocaleLowerCase()
  const { request: { headers } } = ctx
  const { range } = headers

  if (range) {
    let parts = range.replace(/bytes=/, "").split("-")
    let start = parseInt(parts[0], 10)
    let end = parts[1] ? parseInt(parts[1], 10) : start + 1024 * 1024

    end = end > fileSize - 1 ? fileSize - 1 : end

    let chunkSize = (end - start) + 1
    let readStream = fs.createReadStream(filePath, { start, end })
    let head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mime
    }
    ctx.set(head)
    ctx.status = 206
    ctx.body = readStream
  } else {
    let head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    ctx.set(head)
    const readStream = fs.createReadStream(filePath)
    ctx.body = readStream
  } 
}

module.exports = {
  createHlsVideo,
  videoDataParse
}