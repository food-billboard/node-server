const path = require('path')
const fs = require('fs')
const { ImageModel, VideoModel, UserModel, OtherMediaModel, STATIC_FILE_PATH, isType, fileEncoded } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

//检查是否存在文件夹
const checkDir = path => !fs.existsSync(path) || !fs.statSync(path).isDirectory()

//检查并创建文件夹
const checkAndCreateDir = (...paths) => paths.forEach(path => Array.isArray(path) ? checkAndCreateDir(path) : ( typeof path === 'string' && checkDir(path) && fs.mkdirSync(path)))

//获取最终文件存放目录
const finalFilePath = (auth, type) => path.resolve(STATIC_FILE_PATH, auth, type)

//查看文件是否存在且完整
const isFileExistsAndComplete = (name, type, size, auth="public") => {
  try {
    let dirPath = path.resolve(STATIC_FILE_PATH, auth.toLowerCase(), type.toLowerCase())
    let stat = fs.statSync(path.resolve(dirPath, name))
    if(fs.existsSync(path.resolve(dirPath, name)) && stat.isFile() && Number(stat.size) === Number(size)) {
      return true
    }
    return false
  }catch(_) {
    // console.log(_)
    return false
  }
}

//计算base64大小
const base64Size = base64 => {
  let body = base64.split(",")[1]
  const equalIndex = body.indexOf('=')
  if(body.indexOf('=') > 0) {
      body = body.substring(0, equalIndex)
  }
  const length = body.length
  return parseInt( length - ( length / 8 ) * 2 )
}

//临时随机名称
const randomName = () => `${Date.now()}${new Array(Math.ceil(Math.random() * 10)).fill(Math.ceil(Math.random() * 10)).map((i, j) => Math.abs(i - j)).join('')}`

//图片内容上传处理
/**
 * 
 * @param  {...any} files { file: 文件, auth: 权限类型[ PUBLIC, PRIVATE ]}
 */
const dealMedia = async (origin, auth='PUBLIC', ...files) => {
  //判断静态资源目录是否存在
  let staticPath = path.resolve(STATIC_FILE_PATH)
  checkAndCreateDir(staticPath)

  const realFiles = files.filter(file => isType(file, 'object') || (isType(file, 'string') && /^data:.+\/.+;base64,.+/g.test(file)))
  let originType
  let originId

  //资源来源判断
  if(origin.toLowerCase && origin.toLowerCase() === 'system') {
    originType = origin.toUpperCase()
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
      ...( 
        isType(origin, 'object') || (isType(origin, 'string') && origin.length > 11) ?
        { _id: ObjectId(origin) }
        :
        { mobile: Number(origin) }
      )
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
  if(!originId) return [...files]

  let authPath, typePath
  //权限目录
  if(auth === 'PRIVATE') {
    authPath = auth.toLowerCase()
  }else {
    authPath = 'public'
  }
  staticPath = path.resolve(staticPath, authPath)
  checkAndCreateDir(staticPath)
  
  return await Promise.allSettled(realFiles.map(async (file) => {
    let realType
    let typeArr
    let fileSize
    //文件真实存储路径
    let realFilePath
    let realName
    //临时文件名称
    const templateName = randomName()

    //文件类型目录
    if(isType(file, 'string')) {
      const [ type ] = file.match(/(?<=:).+(?=;)/)
      typeArr = type.split('/')
    }else {
      const { type } = file
      typeArr = type.split('/')
    }
    typePath = typeArr[0]
    realType = typeArr[1]  

    if(typePath.toLowerCase() !== 'image' && typePath.toLowerCase() !== 'video') typePath = 'other'
    
    staticPath = path.resolve(staticPath, typePath)
    checkAndCreateDir(staticPath)

    //文件是否存在判断
    const existCheck = async (name) => {
      if(isFileExistsAndComplete(name, typePath, fileSize, auth.toLowerCase())) {
        //判断数据库是否存在
       let Model
       if(typePath === 'image') {
         Model = ImageModel
       }else if(typePath === 'video') {
         Model = VideoModel
       }else {
         Model = OtherMediaModel
       }
       return await ImageModel.findOne({
         src: realFilePath
       })
       .select({_id: 1})
       .exec()
       .then(data => {
         Model = null
         return !!data ? 1 : -1
       })
      }
      return false
    }

    //文件内容写入
    if(isType(file, 'object')) {

      const { path: filePath, size } = file
      fileSize = size
      if(!filePath) return target 

      //加密文件并重命名
      try {
        const data = fs.readFileSync(filePath)
        realName = fileEncoded(data)
      }catch(err) {
        realName = templateName
        console.log(err)
      }finally{
        staticPath = path.resolve(staticPath, `${realName}.${realType}`)
      }

      realFilePath = staticPath.match(/\/static\/.+/)[0]
      if(!realFilePath) return target

      const exist = await existCheck(`${realName}.${realType}`)

      //判断文件是否存在
      if(exist) {
        if(~exist) return null
      }else {
        //文件写入
        const readStream = fs.createReadStream(filePath)
        const writeStream = fs.createWriteStream(staticPath)
        readStream.pipe(writeStream)
        const res = await new Promise((resolve, _) => {
          readStream.on('end', function(err, _) {
            if(err) resolve(target)
            fs.unlinkSync(filePath)
            resolve(null)
          })
        })
        if(res) return res
      }
    }else {
      try{
        const templateFilePath = path.resolve(staticPath, `${templateName}.${realType}`)
        //文件写入
        const content = new Buffer.from(file.replace(/^data.+\/.+;base64,/g, ''), 'base64')
        fs.writeFileSync(templateFilePath, content)
        //加密文件
        const data = fs.readFileSync(templateFilePath)
        const { size } = fs.statSync(templateFilePath)
        fileSize = size
        realName = fileEncoded(data)
        staticPath = path.resolve(staticPath, `${realName}.${realType}`)
        realFilePath = staticPath.match(/\/static\/.+/)[0]
        //判断文件是否存在
        const exist = await existCheck(`${realName}.${realType}`)
        if(exist) {
          console.log(exist)
          //删除刚刚写入的文件
          if(~exist) return null
        }else {
          //重命名
          fs.renameSync(templateFilePath, staticPath)
        }
        if(!realType) return target
      }catch(err) {
        console.log(err)
        return target
      }finally{
        // fs.unlinkSync()
        console.log('查看是否存在临时文件')
      }
    }

    //保存数据库
    let Model
    if(typePath === 'image') {
      Model = ImageModel
    }else if(typePath === 'video') {
      Model = VideoModel
    }else {
      Model = OtherMediaModel
    }

    let objModel = {
      name: realName,
      src: realFilePath,
      origin_type: originType,
      origin: originId,
      auth
    }

    return await Model.findOne({
      ...objModel
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data)
    .then(data => {
      if(data) {
        return null
      }else {
        const model = new Model({
          ...objModel,
          info: {
            size: fileSize,
            complete: [0],
            chunk_size: 1,
            mime: realType,
            status: 'COMPLETE'
          }
        })  
        return model.save()
      }
    })
    .then(data => {
      Model = null
      return data
    })
    .catch(err => {
      console.log('更改路径错误', err)
      return target
    })
  }))
}

//文件合并
/**
 * name 文件名
 * extname 文件类型
 * mime 后缀
 * auth 权限目录
 */
const mergeChunkFile = ( { name, extname, mime, auth } ) => {
  mime = mime && mime.toLowerCase()
  let templatePath = path.resolve(STATIC_FILE_PATH, 'template')
  let realPath = path.resolve(STATIC_FILE_PATH, auth)
  checkAndCreateDir(templatePath, realPath)
  realPath = path.resolve(realPath, extname)
  checkAndCreateDir(realPath)
  templatePath = path.resolve(templatePath, name)
  //判断文件夹是否存在
  if(checkDir(templatePath)) return ['not found', null]
  //对文件进行合并
  const chunkList = fs
  .readdirSync(templatePath)
  .filter(f => path.extname(f) === '' && f !== name && f.includes('-'))
  .sort((suffixA, suffixB) => Number(suffixA.split('-')[1]) - Number(suffixB.split('-')[1]))

  realPath = path.resolve(realPath, name)

  //创建空文件
  fs.writeFileSync(realPath, '')

  chunkList.forEach(chunk => {
    fs.appendFileSync(realPath, fs.readFileSync(path.resolve(templatePath, chunk)))
    fs.unlinkSync(path.resolve(templatePath, chunk))
  })

  fs.renameSync(realPath, `${realPath}.${mime}`)
  fs.rmdirSync(templatePath)
  return [null, name]
}

//blob文件保存
const conserveBlob = (prevFilePath, name, index) => {
  console.log(name)
  checkAndCreateDir(STATIC_FILE_PATH)
  let templatePath = path.resolve(STATIC_FILE_PATH, 'template')
  checkAndCreateDir(templatePath)
  templatePath = path.resolve(templatePath, name)
  checkAndCreateDir(templatePath)

  const filename = path.resolve(templatePath, `${name}-${index}`)
  //分片存在则直接删除临时文件并返回success
  if(fs.existsSync(filename)) {
    fs.unlinkSync(prevFilePath)
    return Promise.resolve({ name, index })
  }

  const readStream = fs.createReadStream(prevFilePath)
  const writeStream = fs.createWriteStream(filename)
  readStream.pipe(writeStream)
  return new Promise((resolve, reject) => {
    readStream.on('end', function(err, _) {
      fs.unlinkSync(prevFilePath)
      if(err) return reject({ errMsg: 'write blob error', status: 500 })
      resolve({ name, index })
    })
  })
}

module.exports = {
  dealMedia,
  checkAndCreateDir,
  mergeChunkFile,
  finalFilePath,
  conserveBlob,
  isFileExistsAndComplete,
  base64Size
}