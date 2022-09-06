const puppeteer = require('puppeteer')
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const { GET_MOVIE_BASE_INFO } = require('./constants')
const { getWordPinYin } = require('@src/utils')
const { downloadVideo } = require('@src/utils/download')
const { fileEncoded } = require('@src/utils/token')
const { MEDIA_STATUS, MEDIA_AUTH, MEDIA_ORIGIN_TYPE, STATIC_FILE_PATH } = require('@src/utils/constant')
const { 
  VideoModel, 
  ImageModel,
  LanguageModel,
  DistrictModel,
  DirectorModel,
  ActorModel,
  ClassifyModel
} = require('@src/utils/mongodb/mongo.lib')

const COMMON_PUPPETEER_ARGS = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }

async function searchActorData(item) {
  const { id } = item 
  const browser = await puppeteer.launch(COMMON_PUPPETEER_ARGS);
  const page = await browser.newPage();

  let districtId 

  try {
    await page.goto(`https://movie.douban.com/celebrity/${id}/`, {
      timeout: 20000
    })
    const district = await page.$$eval('#headline .info ul li', value => {
      let target
      value.some(item => {
        const span = item.querySelector('span')
        const content = span.innerHTML 
        if(content.startsWith('出生地')) {
          const district = span.nextSibling.textContent 
          // : 中国台湾,澎湖 
          target = district.split(':')[1].split(',')[0].trim().split(' ')[0].trim()
          return true 
        }
        return false 
      })
  
      return target 
  
    })
  
    if(!district) {
      return {
        district: undefined
      }
    }
  
    [ districtId ] = await findAndCreateDistrict([district]) 

  }catch(err) {

  }finally {
    await browser.close()
    return {
      district: districtId
    }
  }
}

async function findAndCreateActor(actor, userId) {
  const actorNameList = actor.map(item => item.value)
  return ActorModel.aggregate([
    {
      $match: {
        name: {
          $in: actorNameList
        }
      }
    }
  ])
  .then(async (data) => {
    const {
      exists,
      unExists
    } = data.reduce((acc, cur) => {
      const { name, _id } = cur
      if(actorNameList.includes(name)) {
        acc.exists.push(_id)
        acc.unExists = acc.unExists.filter(item => item.value !== name)
      }
      return acc 
    }, {
      exists: [],
      unExists: actor
    })

    let result = [] 
    for(let i =0; i < unExists.length; i ++) {
      const item = unExists[i]
      const { district } = await searchActorData(item)
      if(!district) continue
      const modal = new ActorModel({
        name: item.value,
        key: getWordPinYin(item.value),
        source: userId,
        country: district,
      })
      const id = await modal.save()
      .then(data => data._id)
      result.push(id)
    }

    return [
      ...result,
      ...exists
    ]
  })
}

async function findAndCreateDirector(director, userId) {
  const directorNameList = director.map(item => item.value)
  return DirectorModel.aggregate([
    {
      $match: {
        name: {
          $in: directorNameList
        }
      }
    }
  ])
  .then(async (data) => {
    const {
      exists,
      unExists
    } = data.reduce((acc, cur) => {
      const { name, _id } = cur
      if(directorNameList.includes(name)) {
        acc.exists.push(_id)
        acc.unExists = acc.unExists.filter(item => item !== name)
      }
      return acc 
    }, {
      exists: [],
      unExists: director
    })
    let result = [] 
    for(let i =0; i < unExists.length; i ++) {
      const item = unExists[i]
      const { district } = await searchActorData(item)
      if(!district) continue
      const modal = new DirectorModel({
        name: item.value,
        key: getWordPinYin(item.value),
        source: userId,
        country: district,
      })
      const id = await modal.save()
      .then(data => data._id)
      result.push(id)
    }
    return [
      ...result,
      ...exists
    ]
  })
}

async function findAndCreateLanguage(language, userId) {
  return LanguageModel.aggregate([
    {
      $match: {
        name: {
          $in: language
        }
      }
    }
  ])
  .then(async (data) => {
    const {
      exists,
      unExists
    } = data.reduce((acc, cur) => {
      const { name, _id } = cur
      if(language.includes(name)) {
        acc.exists.push(_id)
        acc.unExists = acc.unExists.filter(item => item !== name)
      }
      return acc 
    }, {
      exists: [],
      unExists: language
    })
    const result = await Promise.all(unExists.map(item => {
      const modal = new LanguageModel({
        name: item,
        key: getWordPinYin(item),
        source: userId
      })
      return modal.save()
      .then(data => data._id)
    }))
    return [
      ...result,
      ...exists
    ]
  })
}

async function findAndCreateClassify(classify, userId) {
  return ClassifyModel.aggregate([
    {
      $match: {
        name: {
          $in: classify
        }
      }
    }
  ])
  .then(async (data) => {
    const {
      exists,
      unExists
    } = data.reduce((acc, cur) => {
      const { name, _id } = cur
      if(classify.includes(name)) {
        acc.exists.push(_id)
        acc.unExists = acc.unExists.filter(item => item !== name)
      }
      return acc 
    }, {
      exists: [],
      unExists: classify
    })
    const result = await Promise.all(unExists.map(item => {
      const modal = new ClassifyModel({
        name: item,
        key: getWordPinYin(item),
        source: userId
      })
      return modal.save()
      .then(data => data._id)
    }))
    return [
      ...result,
      ...exists
    ]
  })
}

async function findAndCreateDistrict(district, userId) {
  return DistrictModel.aggregate([
    {
      $match: {
        name: {
          $in: district
        }
      }
    }
  ])
  .then(async (data) => {
    const {
      exists,
      unExists
    } = data.reduce((acc, cur) => {
      const { name, _id } = cur
      if(district.includes(name)) {
        acc.exists.push(_id)
        acc.unExists = acc.unExists.filter(item => item !== name)
      }
      return acc 
    }, {
      exists: [],
      unExists: district
    })
    const result = await Promise.all(unExists.map(item => {
      const modal = new DistrictModel({
        name: item,
        key: getWordPinYin(item),
        source: userId
      })
      return modal.save()
      .then(data => data._id)
    }))
    return [
      ...result,
      ...exists
    ]
  })
}

async function fetchDouData({
  movieId,
  userId,
}) {
  const { poster, actor, director, district, language, classify, ...nextBaseInfo } = await fetchBaseInfo(movieId)
  const images = await fetchImages(movieId)
  const video = await fetchVideo(movieId)

  const idPoster = await downloadFile(poster, 'webp', userId)
  const idImages = await Promise.all(images.map(item => {
    return downloadFile(item, 'webp', userId)
  }))

  let idVideo 
  if(video) {
    idVideo = await downloadFile(video, 'mp4', userId, idPoster)
  }

  const newActor = await findAndCreateActor(actor, userId)
  const newDirector = await findAndCreateDirector(director, userId)
  const newDistrict = await findAndCreateDistrict(district, userId)
  const newLanguage = await findAndCreateLanguage(language, userId)
  const newClassify = await findAndCreateClassify(classify, userId)
  return {
    ...nextBaseInfo,
    images: idImages,
    video: idVideo,
    poster: idPoster,
    actor: newActor,
    director: newDirector,
    district: newDistrict,
    language: newLanguage,
    classify: newClassify
  }
}

async function fetchImages(movieId) {
  const browser = await puppeteer.launch(COMMON_PUPPETEER_ARGS);
  const page = await browser.newPage();
  let image 
  try {
    await page.goto(`https://movie.douban.com/subject/${movieId}/all_photos`);
    image = await page.$$eval(`#content .article .mod .bd ul li`, value => {
      return value.slice(0, 10).map(item => {
        const target = item.querySelector('a img')
        const src = target.src
        return src.replace('sqxs', 'l')
      })
    })
    return image 
  }catch(err) {

  }finally {
    await browser.close()
  }
  return image
}

async function fetchVideo(movieId) {
  const browser = await puppeteer.launch(COMMON_PUPPETEER_ARGS);
  const page = await browser.newPage();
  let video 
  try {
    await page.goto(`https://movie.douban.com/subject/${movieId}/trailer#trailer`);
    const videoSrc = await page.$eval(`#content .article .mod .video-list li a`, value => {
      return value ? value.href : ''
    })
    page.close()

    if(videoSrc) {
      const previewPage = await browser.newPage();
      await previewPage.goto(videoSrc)
      video = await previewPage.$eval('.video-js video source', value => {
        return value.src
      })
    }

  }catch(err) {
    
  }finally {
    await browser.close()
    return video
  }
}

async function fetchBaseInfo(movieId) {
  const browser = await puppeteer.launch(COMMON_PUPPETEER_ARGS);
  const page = await browser.newPage();
  let result 
  try {
    await page.goto(`https://movie.douban.com/subject/${movieId}/`);
    result = await GET_MOVIE_BASE_INFO(page)
  }catch(err) {

  }finally {
    await browser.close()
    return result 
  }
}

async function getMediaInfo(src, type) {
  const Model = type === 'image' ? ImageModel : VideoModel
  return Model.findOne({
    src
  })
  .select({
    auth: 1,
    _id: 1,
    "info.status": 1
  })
  .exec() 
  .catch(err => {
    return null 
  })
}

async function createMedia({
  src,
  type,
  md5,
  size,
  poster,
  origin
}) {
  let modal 
  if(type === 'image') {
    modal = new ImageModel({
      name: `file_name_${Date.now()}.webp`,
      src,
      auth: MEDIA_AUTH.PUBLIC,
      origin_type: MEDIA_ORIGIN_TYPE.USER,
      origin,
      info: {
        mime: 'webp',
        status: MEDIA_STATUS.COMPLETE,
        md5,
        size
      },
    })
  }else {
    modal = new VideoModel({
      name: `file_name_${Date.now()}.mp4`,
      src,
      auth: MEDIA_AUTH.PUBLIC,
      origin_type: MEDIA_ORIGIN_TYPE.USER,
      origin,
      poster,
      info: {
        mime: 'mp4',
        status: MEDIA_STATUS.COMPLETE,
        md5,
        size
      },
    })
  }
  return modal.save()
  .then(data => {
    return data._id 
  })
  .catch(err => {
    return ''
  })
}

async function updateMedia(_id) {
  const modal = type === 'image' ? ImageModel : VideoModel
  return modal.updateOne({
    _id
  }, {
    auth: MEDIA_AUTH.PUBLIC,
    info: {
      status: MEDIA_STATUS.COMPLETE,
    },
  })
}

async function downloadFile(url, mime, userId, poster) {
  const templateDir = path.join(STATIC_FILE_PATH, 'template')
  const filename = `template_file_${Date.now()}_${Math.random()}`
  const templateFile = path.join(templateDir, `${filename}.${mime}`)
  if(!fs.existsSync(templateDir)) fs.mkdirSync(templateDir)

  if(!fs.existsSync(templateFile)) {
    const result = await downloadVideo(url, filename, templateDir)
  }

  const fileData = fs.readFileSync(templateFile)
  const md5 = fileEncoded(fileData)

  const fileType = mime === 'webp' ? 'image' : 'video'
  const realFilePath = path.join(STATIC_FILE_PATH, fileType, `${md5}.${mime}`)
  const fileStat = fs.statSync(templateFile)
  const dataBaseSrc = `/static/${fileType}/${md5}.${mime}`
  const isDatabaseExists = await getMediaInfo(dataBaseSrc, fileType)

  let mediaId 

  if(isDatabaseExists) {
    if(isDatabaseExists.info.status !== MEDIA_STATUS.COMPLETE) {
      await updateMedia()
      await fsExtra.move(templateFile, realFilePath)
    }else {
      fs.unlinkSync(templateFile)
    }
    mediaId = isDatabaseExists._id 
  }else {
    mediaId = await createMedia({
      src: dataBaseSrc,
      type: fileType,
      md5,
      size: fileStat.size,
      poster: poster,
      origin: userId
    })
    await fsExtra.move(templateFile, realFilePath)
  }

  return mediaId

}

module.exports = {
  fetchDouData
}

// const { Types: { ObjectId } } = require('mongoose')

// console.log(Date.now())
// fetchDouData({
//   movieId: '4315388',
//   userId: ObjectId('8f63270f005f1c1a0d9448ca')
// })
// .then(_ => {
//   console.log(Date.now(), _)
// })