const path = require('path')
const fs = require('fs')
const { ImageModel, VideoModel, UserModel, OtherMediaModel } = require('./mongodb/mongo.lib')
const { Types: { ObjectId } } = require('mongoose')

//静态资源目录
const STATIC_FILE_PATH = path.resolve(__dirname, '../../static')

//检查并创建文件夹
const checkAndCreateDir = (path) => (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) && fs.mkdirSync(path)

//图片内容上传处理
/**
 * 
 * @param  {...any} files { file: 文件, auth: 权限类型[ PUBLIC, PRIVATE ], origin: 来源作者 | ORIGIN }
 */
const dealMedia = async (...files) => {
  //判断静态资源目录是否存在
  let staticPath = path.resolve(STATIC_FILE_PATH)
  checkAndCreateDir(staticPath)

  const realFiles = files.filter(f => isObject(f.file) || (isString(f.file) && /^data:.+\/.+;base64,\w+/g.test(f.file)))
  
  return await Promise.allSettled(realFiles.map(async (target) => {
    let authPath, typePath
    let realType
    let typeArr
    let originType
    let originId
    const { file, auth, origin } = target
    //权限目录
    if(auth === 'PRIVATE') {
      authPath = 'private'
    }else {
      authPath = 'public'
    }
    staticPath = path.resolve(staticPath, authPath)
    checkAndCreateDir(staticPath)

    //文件类型目录
    if(isString(file)) {
      const [ type ] = file.match(/(?<=:).+(?=;)/)
      typeArr = type.split('/')
    }else {
      const { type } = file
      typeArr = type.split('/')
    }
    typePath = typeArr[0]
    realType = typeArr[1]  
    
    staticPath = path.resolve(staticPath, typePath)
    checkAndCreateDir(staticPath)

    //资源来源判断
    if(isString(origin)) {
      originType = 'SYSTEM'
      originId = await UserModel.findOne({
        mobile: 18368003193,
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(data => {
        if(!data) return Promise.reject({ errMsg: 'not Found' })
        return data._id
      })
      .catch(err => {
        console.log(err)
        return false
      })
    }else {
      originType = 'USER'
      originId = await UserModel.findOne({
        _id: ObjectId(origin)
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(data => {
        if(!data) return Promise.reject({ errMsg: 'not Found' })
        return data._id
      })
      .catch(err => {
        console.log(err)
        return false
      })
    }

    //用于后面筛选失败的项目
    if(!originId) return target

    let model
    let Model
    if(typePath === 'image') {
      model = new ImageModel({
        src: 'template',
        origin_type: originType,
        origin: originId
      })
      Model = ImageModel
    }else if(typePath === 'video') {
      model = new VideoModel({
        src: 'template',
        // poster: {
        //   type: ObjectId,
        //   ref: 'image'
        // },
        origin_type: originType,
        origin: originId
      })
      Model = VideoModel
    }else {
      model = new OtherMediaModel({
        src: 'template',
        origin_type: originType,
        origin: originId
      })
      Model = OtherMediaModel
    }

    await model.save()
    .then(data => !!data && data._id)
    .then(id => {
      const strId = id.toString()
      const filePath = `/static/${staticPath.split('/static/')[1]}/${strId}.${realType}`
      staticPath = path.resolve(staticPath, `${strId}.${realType}`)
      return Model.updateOne({
        _id: id,
        src: 'template'
      }, {
        src: filePath
      })
    })
    .then(_ => {
      Model = null
    })
    .catch(err => {
      console.log('更改路径错误', err)
    })

    //文件内容写入
    if(isObject(file)) {
      const filePath = file.path
      if(!filePath) return target 
      const readStream = fs.createReadStream(filePath)
      const writeStream = fs.createWriteStream(staticPath)
      readStream.pipe(writeStream)
      return await new Promise((resolve, _) => {
        readStream.on('end', function(err, res) {
          if(err) resolve(target)
          fs.unlinkSync(filePath)
          resolve(null)
        })
      })
    }else {
      fs.writeFileSync(staticPath, file)
    }

    return null
  }))
}

//文件合并
const mergeChunkFile = ( file, type ) => {
  let templatePath = path.resolve(STATIC_FILE_PATH, 'template')
  checkAndCreateDir(templatePath)
  templatePath = path.resolve(templatePath, file)
  //判断文件夹是否存在
  if(!(fs.existsSync(path) && fs.statSync(path).isDirectory())) return false

  //对文件进行合并
}

module.exports = {
  dealMedia,
  checkAndCreateDir,
  mergeChunkFile
}