const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const Mime = require('mime')
const formidable = require('formidable')
const { ImageModel, VideoModel, OtherMediaModel, notFound, STATIC_FILE_PATH, MEDIA_STATUS, checkAndCreateDir, checkDir } = require('@src/utils')
const { promiseAny } = require('./util')

const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i

//获取分片文件
const getChunkFileList = (chunk_path) => {
  if(!checkDir(chunk_path)) {
    return fs.readdir(chunk_path)
    .then(data => data.filter(f => path.extname(f) === '' && f.includes('-')))
    .catch(_ => [])
  } 
  return Promise.resolve([])
}

//blob文件保存
const conserveBlob = async ({
  file, 
  md5, 
  index,
  folder,
  filePath,
}) => {

  let templatePath = folder

  try {
    await fs.access(folder)
    //存在分片则直接删除
    if(fsSync.existsSync(filePath)) return Promise.resolve({ name: md5, index })
  }catch(err) {
    //将分片文件集中存储在临时文件夹中
    checkAndCreateDir(STATIC_FILE_PATH)
    templatePath = path.resolve(STATIC_FILE_PATH, 'template')
    checkAndCreateDir(templatePath)
    templatePath = path.resolve(templatePath, md5)
    checkAndCreateDir(templatePath)
  }

  //base64
  if(typeof file === 'string') {
    const base64Data = base64Reg.test(file) ? file.replace(/^data:.{1,10}\/.{1,10};base64,/i, '') : file

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, base64Data, 'base64',function(err) {
        if(err) return reject({ errMsg: 'write file error', status: 500 })
        return resolve({ name: md5, index })
      })
    })
  }
  //blob | file
  else if(typeof file === 'object' && !!file.path){

    const prevFilePath = file.path
    //创建读写流
    const readStream = fsSync.createReadStream(prevFilePath)
    const writeStream = fsSync.createWriteStream(filePath)
    readStream.pipe(writeStream)
    return new Promise((resolve, reject) => {
      readStream.on('end', function(err, _) {
        if(err) return reject({ errMsg: 'write blob error', status: 500 })
        //删除临时文件
        fs.unlink(prevFilePath)
        .then(_ => {
          resolve({ name: md5, index })
        })
        .catch(err => {
          console.log(err)
          reject({ errMsg: 'unlink error', status: 500 })
        })
      })
    })

  }
}

//文件合并
const mergeChunkFile = async ({ 
  folder: templateFolder,
  realFilePath
}) => {

  try {
    if(!fsSync.existsSync(templateFolder)) return Promise.reject({ errMsg: 'not found', status: 404 })
  }catch(err) {
    console.log(err)
    return Promise.reject({ errMsg: 'not found', status: 404 })
  }

  //对文件进行合并
  let chunkList = await getChunkFileList(templateFolder)
  chunkList.sort((suffixA, suffixB) => Number(suffixA.split('-')[1]) - Number(suffixB.split('-')[1]))
  if(!chunkList.every((chunk, index) => index == Number(chunk.split('-')[1]))) return Promise.reject({ errMsg: 'not complete', status: 403 })
  
  //文件合并
  const mergeTasks = async () => {
    for(let i = 0; i < chunkList.length; i ++) {
      const chunk = chunkList[i]
      await fs.readFile(path.resolve(templateFolder, chunk))
      .then(data => fs.appendFile(realFilePath, data))
      .then(_ => fs.unlink(path.resolve(templateFolder, chunk)))
    }
  }

  return fs.writeFile(realFilePath, '')
  .then(_ => mergeTasks())
  .then(_ => fs.rmdir(templateFolder))
  .catch(err => {
    console.log(err)
    return {
      errMsg: 'file merge error',
      status: 500
    }
  })

}

//查找未完成
const findUnCompleteIndex = ({
  complete,
  current,
  size,
  chunk_size,
  index
}) => {

  if(!complete.length) {
    if(chunk_size * index >= size) return size
    const nextOffset = (index + 1) * chunk_size
    return nextOffset >= size ? size : nextOffset
  }

  const chunkLength = Math.ceil(size / chunk_size)

  const sortComplete = [...complete].sort((a, b) => a - b)
  let minUnComplete = -1
  sortComplete.some((item, idx) => {
    if(item != idx) {
      minUnComplete = idx
      return true
    }
    return false
  })

  //全部完成
  if(!~minUnComplete) {
    if(index == chunkLength - 1) {
      return size
    }
    return (index + 1) * chunk_size
  }

  return minUnComplete * chunk_size

}

const pathMediaDeal = {
  image: ({
    user,
    ctx,
    metadata
  }) => {

    const { md5, offset, length } = metadata

    return ImageModel.findOne({
      "info.md5": md5,
    })
    .select({
      "info.complete": 1,
      "info.chunk_size": 1,
      "info.size": 1,
      "info.mime": 1,
      auth: 1
    })
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { info: { complete, chunk_size, size, mime:upperMime }, auth } = data

      const mime = upperMime.toLowerCase()
      const numberOffset = parseInt(offset)
      const multiple = numberOffset / chunk_size
      if(numberOffset > size || parseInt(multiple) !== multiple) return Promise.reject({
        errMsg: 'bad request',
        status: 400
      })

      const update = (config) => {
        return ImageModel.updateOne({
          "info.md5": md5
        }, config)
      }

      const basePath = path.join(STATIC_FILE_PATH, 'template', md5)
      //查找下一个需要上传的分片
      const nextOffset = findUnCompleteIndex({
        size,
        chunk_size,
        complete,
        current: numberOffset,
        index: multiple
      })
      const isComplete = nextOffset === size

      //返回文件相关信息
      const result = {
        filePath: path.join(basePath, `${md5}-${multiple}`),
        folder: basePath,
        realFilePath: path.join(STATIC_FILE_PATH, 'image', `${md5}.${Mime.getExtension(mime)}`),
        model: ImageModel,
        type: 'image',
        complete: isComplete,
        offset: nextOffset,
        index: multiple,
        success: () => {

          let updateConfig = {}
          if(isComplete) {
            updateConfig = {
              $set: {
                "info.status": MEDIA_STATUS.COMPLETE,
                "info.complete": []
              },
            }
          }else {
            updateConfig = {
              $addToSet: {
                "info.complete": multiple
              },
            }
          }

          return update(updateConfig)
        },
        error: () => update({
          $set: {
            "info.status": MEDIA_STATUS.UPLOADING,
          },
          $pull: {
            "info.complete": multiple
          }
        })
      }

      return result

    })

  },
  video: ({
    user,
    ctx,
    metadata
  }) => {
    const { md5, offset, length } = metadata

    return VideoModel.findOne({
      "info.md5": md5,
    })
    .select({
      "info.complete": 1,
      "info.chunk_size": 1,
      "info.size": 1,
      "info.mime": 1,
      auth: 1
    })
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { info: { complete, chunk_size, size, mime:upperMime }, auth } = data
      
      const mime = upperMime.toLowerCase()
      const numberOffset = parseInt(offset)
      const multiple = numberOffset / chunk_size

      if(numberOffset > size || parseInt(multiple) !== multiple) return Promise.reject({
        errMsg: 'bad request',
        status: 400
      })

      const update = (config) => {
        return VideoModel.updateOne({
          "info.md5": md5
        }, config)
      }

      const basePath = path.join(STATIC_FILE_PATH, 'template', md5)
      //查找下一个需要上传的分片
      const nextOffset = findUnCompleteIndex({
        size,
        chunk_size,
        complete,
        current: numberOffset,
        index: multiple
      })

      const isComplete = nextOffset === size

      //返回文件相关信息
      const result = {
        filePath: path.join(basePath, `${md5}-${multiple}`),
        folder: basePath,
        realFilePath: path.join(STATIC_FILE_PATH, 'video', `${md5}.${Mime.getExtension(mime)}`),
        model: VideoModel,
        type: 'video',
        complete: isComplete,
        offset: nextOffset,
        index: multiple,
        success: () => {

          let updateConfig = {}
          if(isComplete) {
            updateConfig = {
              $set: {
                "info.status": MEDIA_STATUS.COMPLETE,
                "info.complete": []
              },
            }
          }else {
            updateConfig = {
              $addToSet: {
                "info.complete": multiple
              },
            }
          }

          return update(updateConfig)
        },
        error: () => update({
          $set: {
            "info.status": MEDIA_STATUS.UPLOADING,
          },
          $pull: {
            "info.complete": multiple
          }
        })
      }

      return result

    })
  },
  other: ({
    user,
    ctx,
    metadata
  }) => {
    const { md5, offset, length } = metadata

    return OtherMediaModel.findOne({
      "info.md5": md5,
    })
    .select({
      "info.complete": 1,
      "info.chunk_size": 1,
      "info.size": 1,
      "info.mime": 1,
      auth: 1
    })
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { info: { complete, chunk_size, size, mime: upperMime }, auth } = data

      const mime = upperMime.toLowerCase()
      const numberOffset = parseInt(offset)
      const multiple = numberOffset / chunk_size
      if(numberOffset > size || parseInt(multiple) !== multiple) return Promise.reject({
        errMsg: 'bad request',
        status: 400
      })

      const update = (config) => {
        return OtherMediaModel.updateOne({
          "info.md5": md5
        }, config)
      }

      const basePath = path.join(STATIC_FILE_PATH, 'template', md5)
      //查找下一个需要上传的分片
      const nextOffset = findUnCompleteIndex({
        size,
        chunk_size,
        complete,
        current: numberOffset,
        index: multiple
      })
      const isComplete = nextOffset === size

      //返回文件相关信息
      const result = {
        filePath: path.join(basePath, `${md5}-${multiple}`),
        folder: basePath,
        realFilePath: path.join(STATIC_FILE_PATH, 'other', `${md5}.${Mime.getExtension(mime)}`),
        model: OtherMediaModel,
        type: 'other',
        complete: isComplete,
        offset: nextOffset,
        index: multiple,
        success: () => {

          let updateConfig = {}
          if(isComplete) {
            updateConfig = {
              $set: {
                "info.status": MEDIA_STATUS.COMPLETE,
                "info.complete": []
              },
            }
          }else {
            updateConfig = {
              $addToSet: {
                "info.complete": multiple
              },
            }
          }

          return update(updateConfig)
        },
        error: () => update({
          $set: {
            "info.status": MEDIA_STATUS.UPLOADING,
          },
          $pull: {
            "info.complete": multiple
          }
        })
      }

      return result

    })
  }
}

const patchRequestDeal = (options) => {

  const form = formidable({ multiples: true })
  const { ctx } = options

  return promiseAny(Object.values(pathMediaDeal).map(deal => deal(options)))
  .then(({
    folder,
    filePath,
    realFilePath,
    index,
    offset,
    model,
    type,
    complete,
    success,
    error,
  }) => {
    //文件获取
    return new Promise((resolve, reject) => {
      const { request: { files } } = ctx
      if(!!files && !!files.file) return resolve(files.file)
      form.parse(ctx.req, (err, _, files) => {
        if(err) {
          console.log(err)
          return reject(500)
        }
        if(!files.file) return reject(404)
        resolve(files.file)
      })
    })
    //文件保存及合并
    .then(file => {
      const { metadata: { md5 } } = options

      return conserveBlob({
        file,
        md5,
        folder,
        filePath,
        index
      })

    })  
    .then(_ => {
      //文件合并
      if(complete) return mergeChunkFile({
        folder,
        realFilePath,
      })
    })
    .then(_ => success())
    .then(_ => ({ status: 204, success: true, offset }))
    .catch(err => {
      console.log(err)
      return error()
      .then(_ => Promise.reject({
        status: 500,
        errMsg: 'unknown error'
      }))
    })
  })
  .catch(err => {
    console.log(err)
    return false
  })

}

module.exports = {
  patchRequestDeal
}