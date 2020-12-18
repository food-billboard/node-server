const { Types: { ObjectId } } = require('mongoose')
const path = require('path')
const fs = require('fs')
const Mime = require('mime')
const { 
  ImageModel, 
  VideoModel, 
  OtherMediaSchema,
  UserModel, 
  OtherMediaModel, 
  STATIC_FILE_PATH, 
  isType, 
  fileEncoded, 
  notFound, 
  merge, 
  checkAndCreateDir, 
  checkDir, 
  findMostRole,
  MEDIA_STATUS,
  ROLES_MAP,
  MEDIA_ORIGIN_TYPE
} = require('@src/utils')

const ACCEPT_IMAGE_MIME = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']
const ACCEPT_VIDEO_MIME = ['avi', 'mp4', 'rmvb', 'mkv', 'f4v', 'wmv']
const MAX_FILE_SIZE = 1024 * 1024 * 100

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
    return false
  }
}

//计算base64大小
const base64Size = base64 => {
  let [, body] = base64.split(",")
  if(!body) return 0
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
      src: '',
      info: {
        md5: '',
        mime,
        size,
        status: 'COMPLETE',
        complete: [0],
        chunk_size: 1
      },
      auth,
      origin_type: originType,
      white_list: [originId]
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
          white_list: { $in: [originId] }
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

      }finally{
        staticPath = path.resolve(staticPath, `${databaseModel.info.md5 || databaseModel.name}.${databaseModel.info.mime.split('/')[1]}`)
      }

      const realFilePath = staticPath.match(/(?<=\/static)\/.+/)[0]
      if(!realFilePath) return task
      databaseModel = merge(databaseModel, { src: realFilePath })

      const exist = await existCheck(`${databaseModel.info.md5 || databaseModel.name}.${databaseModel.info.mime.split('/')[1]}`)

      //判断文件是否存在
      if(exist) {
        //文件存在且数据库存在
        if(!!~exist) return null
      }else {
        //文件写入
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
        realFilePath = staticPath.match(/(?<=\/static)\/.+/)[0]
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
        return task
      }finally{
        // fs.unlinkSync()
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

    const { src: _src, origin_type: _origin_type, auth: _auth, info: { md5: _md5, size: _size, mime: _mime, status: _status } } = databaseModel

    return await Model.findOneAndUpdate({
      src: _src,
      origin_type: _origin_type, 
      auth: _auth, 
      "info.md5": _md5,
      "info.size": _size,
      "info.mime": _mime,
      // "info.status": _status
    }, {
      $addToSet: { white_list: originId }
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
      return task
    })
  }))
}

const promiseAny = (tasks) => {
  return Promise.allSettled(tasks)
  .then(data => {
    const target = data.find(task => task.status === 'fulfilled') 
    if(!target) return Promise.reject()
    return target.value
  })
}

const errFirstCallback = (callback, ...args) => {
  return new Promise((resolve, reject) => {
    callback(...args, (err, res) => {
      if(err) reject(err)
      resolve(res)
    })
  })
}

const readFile = (...args) => errFirstCallback(fs.readFile, ...args)

const appendFile = (...args) => errFirstCallback(fs.appendFile, ...args)

const unlink = (...args) => errFirstCallback(fs.unlink, ...args)

const rmdir = (...args) => errFirstCallback(fs.rmdir, ...args)

const writeFile = (...args) => errFirstCallback(fs.writeFile, ...args)

const readdir = (...args) => errFirstCallback(fs.readdir, ...args)

const access = (...args) => errFirstCallback(fs.access, ...args)


module.exports = {
  dealMedia,
  checkAndCreateDir,
  finalFilePath,
  isFileExistsAndComplete,
  base64Size,
  randomName,
  ACCEPT_IMAGE_MIME,
  ACCEPT_VIDEO_MIME,
  MAX_FILE_SIZE,

  readFile,
  appendFile,
  unlink,
  rmdir,
  writeFile,
  readdir,
  access,
  promiseAny
}