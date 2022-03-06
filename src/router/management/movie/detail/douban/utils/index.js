const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { GET_MOVIE_BASE_INFO } = require('./constants')
const { downloadVideo } = require('@src/utils/download')
const { fileEncoded } = require('@src/utils/token')
const { STATIC_FILE_PATH } = require('@src/utils/constant')
const { VideoModel, ImageModel } = require('@src/utils/mongodb/mongo.lib')

async function fetchDouData(movieId='34874432') {
  const { poster, ...nextBaseInfo } = await fetchBaseInfo(movieId)
  const images = await fetchImages(movieId)
  const video = await fetchVideo(movieId)
  const idPoster = await downloadFile(poster, 'webp')
  const idImages = await Promise.all(images.map(item => {
    return downloadFile(item, 'webp')
  }))
  const idVideo = await downloadFile(video, 'mp4')
}

async function fetchImages(movieId) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://movie.douban.com/subject/${movieId}/all_photos`);
  const image = await page.$$eval(`#content .article .mod .bd ul li`, value => {
    return value.slice(0, 10).map(item => {
      const target = item.querySelector('a img')
      const src = target.src
      return src.replace('sqxs', 'l')
    })
  })
  await browser.close()
  return image 
}

async function fetchVideo(movieId) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://movie.douban.com/subject/${movieId}/trailer#trailer`);
  const videoSrc = await page.$eval(`#content .article .mod .video-list li a`, value => {
    return value.href
  })
  page.close()

  const previewPage = await browser.newPage();
  await previewPage.goto(videoSrc)
  const video = await previewPage.$eval('.video-js video source', value => {
    return value.src
  })

  await browser.close()
  return video 
}

async function fetchBaseInfo(movieId) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://movie.douban.com/subject/${movieId}/`);
  const result = await GET_MOVIE_BASE_INFO(page)
  await browser.close()
  return result 
}

async function getMediaInfo(src, type) {
  const Model = type === 'image' ? ImageModel : VideoModel
  return VideoModel.findOne({
    src
  })
}

async function downloadFile(url, mime) {
  const templateDir = path.join(__dirname, './templateDir')
  const templateFile = path.join(templateDir, `template_file_${Date.now()}.${mime}`)
  if(!fs.existsSync(templateDir)) fs.mkdirSync(templateDir)

  const result = await downloadVideo(url, templateFile)

  const fileData = fs.readFileSync(templateFile)
  const md5 = fileEncoded(fileData)

  const fileType = mime === 'webp' ? 'image' : 'video'
  const realFilePath = path.join(STATIC_FILE_PATH, fileType, `${md5}.mime`)
  const isFileExists = fs.existsSync(realFilePath)

  if(isFileExists) {

  }

}



module.exports = {
  fetchDouData
}

fetchDouData()