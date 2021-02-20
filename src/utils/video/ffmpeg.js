const FfmpegCommand = require('fluent-ffmpeg')
const chalk = require('chalk')
const { NETWORK, STATIC_FILE_PATH } = require('../constant')
const path = require('path')

const sleep = (time=4000) => new Promise((resolve) => setTimeout(resolve, time))

const createHls = async (filePath) => {

  let videoName

  try {
    [ videoName ] = filePath.split('/').slice(-1)
    // [ videoName ] = videoName.split('.')
    videoName = videoName.split('.')[0]
  }catch(err) {
    console.log(chalk.red('文件地址错误'), JSON.stringify(err))
    throw new Error({
      err: 'not found'
    })
  }

  return new Promise((resolve, reject) => {
      // make sure you set the correct path to your video file
    var proc = new FfmpegCommand(filePath)
    .inputFPS(29.7)
    .inputOptions('-re')
    // set video bitrate
    // .videoBitrate(1024)
    // set h264 preset
    // .addOption('preset','superfast')
    // set target codec
    // .videoCodec('libx264')
    // set audio bitrate
    // .audioBitrate('128k')
    // set audio codec
    // .audioCodec('libfaac')
    // set number of audio channels
    // .audioChannels(2)
    // set hls segments time
    .addOption('-hls_time', 10)
    .addOption('-c', 'copy')
    .addOption('-f', 'flv')
    // include all the segments in the list
    // .addOption('-hls_list_size',0)
    .on('start', (commandLine) => {
      console.log(commandLine)
      resolve()
    })
    // setup event handlers
    .on('end', function() {
      console.log('file has been converted succesfully')
    })
    .on('error', function(err) {
      reject()
      console.log('an error happened: ' + err)
    })
    .output(`rtmp://${NETWORK}/live/${videoName}`, { end: true })
    .run()
  })
  .then(_ => sleep())
  .then(_ => `http://${NETWORK}:8000/live/${videoName}/index.m3u8`)

}

// createHls(path.join(STATIC_FILE_PATH, '/video/273dbc82f45552ff7b98d36bf1ad86a8.mp4'))

module.exports = {
  createHls
}