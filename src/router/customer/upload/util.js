const path = require('path')
const fs = require('fs')
const { 
  ImageModel, 
  VideoModel, 
  UserModel,
  OtherMediaModel, 
  STATIC_FILE_PATH, 
  isType, 
  fileEncoded, 
  notFound,
  merge
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const ACCEPT_IMAGE_MIME = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']
const ACCEPT_VIDEO_MIME = ['avi', 'mp4', 'rmvb', 'mkv', 'f4v', 'wmv']

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
    if(fs.existsSync(path.resolve(dirPath, name)) && stat.isFile() && (size ? Number(stat.size) === Number(size) : true)) {
      return true
    }
    return false
  }catch(_) {
    console.log(_)
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

const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i

//临时随机名称
const randomName = () => `${Date.now()}${new Array(Math.ceil(Math.random() * 10)).fill(Math.ceil(Math.random() * 10)).map((i, j) => Math.abs(i - j)).join('')}`

//图片内容上传处理
const dealMedia = async (mobile, origin, auth='PUBLIC', ...files) => {
  //判断静态资源目录是否存在
  let staticPath = path.resolve(STATIC_FILE_PATH)
  checkAndCreateDir(staticPath)

  //资源来源判断并获取
  let originType
  let originId

  let originQuery

  if(origin.toLowerCase && origin.toLowerCase() === 'system') {
    originType = origin.toUpperCase()
    originQuery = {
      mobile
    }
  }else {
    originType = 'USER'
    originQuery = isType(origin, 'object') || (isType(origin, 'string') && origin.length > 11) ?
    { _id: ObjectId(origin) }
    :
    { mobile: Number(origin) }
  }
  //来源id获取
  originId = await UserModel.findOne(originQuery)
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .catch(err => {
    console.log(err)
    return false
  })

  //用于后面筛选失败的项目(来源不存在则失败)
  if(!originId) return [...files]

  //文件格式及目录处理
  let authPath, typePath
  //权限目录
  if(auth === 'PRIVATE') {
    authPath = auth.toLowerCase()
  }else {
    authPath = 'public'
  }
  staticPath = path.resolve(staticPath, authPath)
  checkAndCreateDir(staticPath)

  let databaseModels = []
  
  return await Promise.allSettled(files.map(async (task) => {
    const { file, name, mime, size } = task
    //数据库模板
    let databaseModel = {
      name: name || randomName(),
      info: {
        mime,
        size,
      },
      auth,
      origin_type: originType,
      origin: originId
    }

    //文件类型目录
    if(ACCEPT_IMAGE_MIME.some(item => !!~mime.indexOf(item))) {
      typePath = 'image'
    }else if(ACCEPT_VIDEO_MIME.some(item => !!~mime.indexOf(item))) {
      typePath = 'video'
    }else {
      typePath = 'other'
    }
    
    staticPath = path.resolve(staticPath, typePath)
    checkAndCreateDir(staticPath)

    //文件是否存在判断
    const existCheck = async (name) => {

      if(isFileExistsAndComplete(name, typePath, size, auth.toLowerCase())) {
        const { src } = databaseModel
        //判断数据库是否存在
        let Model
        if(typePath === 'image') {
          Model = ImageModel
        }else if(typePath === 'video') {
          Model = VideoModel
        }else {
          Model = OtherMediaModel
        }
        return await Model.findOne({
          src,
          origin: databaseModel.origin
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

      const { path: filePath } = file
      if(!filePath) return task 

      //加密文件并重命名
      try {
        const data = fs.readFileSync(filePath)
        const md5 = fileEncoded(data)
        databaseModel = merge(databaseModel, { info: { md5 } })
      }catch(err) {
        console.log(err)
      }finally{
        staticPath = path.resolve(staticPath, `${databaseModel.info.md5 || databaseModel.name}.${databaseModel.info.mime.split('/')[1]}`)
      }

      const realFilePath = staticPath.match(/\/static\/.+/)[0]
      if(!realFilePath) return task
      databaseModel = merge(databaseModel, { src: realFilePath })

      const exist = await existCheck(`${databaseModel.info.md5 || databaseModel.name}.${databaseModel.info.mime.split('/')[1]}`)

      //判断文件是否存在
      if(exist) {
        //文件存在且数据库存在
        if(!!~exist) return null
      }else {
        //文件写入
        console.log(filePath, staticPath)
        const readStream = fs.createReadStream(filePath)
        const writeStream = fs.createWriteStream(staticPath)
        readStream.pipe(writeStream)
        const res = await new Promise((resolve, _) => {
          readStream.on('end', function(err, _) {
            if(err) resolve(task)
            fs.unlinkSync(filePath)
            resolve(null)
          })
        })
        if(res) return res
      }
    }
    //base64
    else {

      try {

        const [, type] = databaseModel.info.mime.split('/')
        //文件写入(最好将base64正则匹配逻辑写的清晰些，模糊的话在匹配中会花费很大的时间)
        const base64Data = file.replace(/^data:.{1,10}\/.{1,10};base64,/i, '')

        const buffer = new Buffer.from(base64Data, 'base64')
        const md5 = fileEncoded(buffer)

        //文件加密
        databaseModel = merge(databaseModel, { info: { md5 } })
        const name = databaseModel.info.md5 || databaseModel.name

        //获取实际路径
        staticPath = path.resolve(staticPath, `${name}.${type}`)
        realFilePath = staticPath.match(/\/static\/.+/)[0]
        if(!realFilePath) return task
        databaseModel = merge(databaseModel, { src: realFilePath })

        //判断文件是否存在
        const exist = await existCheck(`${name}.${type}`)
        if(exist) {
          if(!!~exist) return null
        }else {
          return new Promise((resolve, reject) => {
            //文件写入
            fs.writeFile(staticPath, base64Data, 'base64', function(err, _) {
              if(err) return reject({ errMsg: 'write blob error', status: 500 })
              // fs.unlinkSync(prevFilePath)
              resolve({ name, type })
            })
          })
        }

      }catch(err) {
        console.log(err)
        return task
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

    return await Model.findOne({
      ...databaseModel
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data)
    .then(data => {
      if(data) {
        return data._id
      }else {
        const model = new Model({
          ...databaseModel,
        })  
        return model.save()
        .then(data => !!data && data._id)
      }
    })
    .then(data => {
      Model = null
      return {
        name: databaseModel.name,
        _id: data
      }
    })
    .catch(err => {
      console.log('更改路径错误', err)
      return task
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
  mime = mime && mime.toLowerCase() && mime.split('/')[1]

  //获取真实存储路径以及临时文件夹文件名称
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

  try {
    chunkList.forEach(chunk => {
      fs.appendFileSync(realPath, fs.readFileSync(path.resolve(templatePath, chunk)))
      fs.unlinkSync(path.resolve(templatePath, chunk))
    }) 
  }catch(err) {
    console.log(err)
    return [err, null]
  }

  //删除临时文件夹并重命名真实文件
  fs.renameSync(realPath, `${realPath}.${mime}`)
  fs.rmdirSync(templatePath)

  return [null, name]
}

//blob文件保存
const conserveBlob = (file, md5, index) => {

  //将分片文件集中存储在临时文件夹中
  checkAndCreateDir(STATIC_FILE_PATH)
  let templatePath = path.resolve(STATIC_FILE_PATH, 'template')
  checkAndCreateDir(templatePath)
  templatePath = path.resolve(templatePath, md5)
  checkAndCreateDir(templatePath)

  //分片名称
  const filename = path.resolve(templatePath, `${md5}-${index}`)

  //存在分片则直接删除
  if(fs.existsSync(filename)) return Promise.resolve({ name: md5, index })

  //base64
  if(typeof file === 'string') {
    const base64Data = base64Reg.test(file) ? file.replace(/^data:.{1,10}\/.{1,10};base64,/i, '') : file

    return new Promise((resolve, reject) => {
      fs.writeFile(filename, base64Data, 'base64',function(err) {
        if(err) return reject({ errMsg: 'write file error', status: 500 })
        return resolve({ name: md5, index })
      })
    })
  }
  //blob | file
  else if(typeof file === 'object' && !!file.path){

    const prevFilePath = file.path
    //创建读写流
    const readStream = fs.createReadStream(prevFilePath)
    const writeStream = fs.createWriteStream(filename)
    readStream.pipe(writeStream)
    return new Promise((resolve, reject) => {
      readStream.on('end', function(err, _) {
        //删除临时文件
        fs.unlinkSync(prevFilePath)
        if(err) return reject({ errMsg: 'write blob error', status: 500 })
        resolve({ name: md5, index })
      })
    })

  }
}

module.exports = {
  dealMedia,
  checkAndCreateDir,
  mergeChunkFile,
  finalFilePath,
  conserveBlob,
  isFileExistsAndComplete,
  base64Size,
  base64Reg,
  randomName,
  ACCEPT_IMAGE_MIME,
  ACCEPT_VIDEO_MIME
}