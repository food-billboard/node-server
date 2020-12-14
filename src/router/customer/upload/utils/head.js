const fs = require('fs')
const path = require('path')
const Mime = require('mime')
const { ImageModel, VideoModel, OtherMediaModel } = require('@src/utils')
const { getChunkFileList } = require('./util')

//删除临时文件
const removeTemplateFolder = (name) => {

  const folder = path.join(STATIC_FILE_PATH, 'template', name)

  return getChunkFileList(folder)
  .then(fileList => Promise.all(fileList.map(file => {
    return new Promise((resolve, reject) => {
      fs.unlink(path.join(folder, file), (err) => {
        if(err) reject(err)
        resolve()
      })
    })
  })))
  .catch(err => {
    console.log(err)
  })

}

const headRequestMediaDeal = {
  imageMediaDeal: ({
    ctx,
    metadata,
    user
  }) => {
  
    const { md5, auth, size, mime, name, chunk } = metadata
    const { roles, _id } = user
    const origin_type = roles === ROLES_MAP.SUPER_ADMIN ? MEDIA_ORIGIN_TYPE.SYSTEM : MEDIA_ORIGIN_TYPE.USER
  
    const defaultModel = {
      name: name || '',
      src: path.join('static', auth.toLowerCase(), 'image', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      auth,
      info: {
        md5,
        complete: [],
        chunk_size: chunk,
        size,
        mime,
        status: MEDIA_STATUS.UPLOADING
      },
    }
  
    return ImageModel.findOne({
      // auth,
      "info.md5": md5,
      "info.mime": mime,
      "info.size": size
    }, {
      $addtoset: {
        white_list: [ _id ]
      }
    })
    .select({
      "info.chunk_size": 1,
      "info.status": 1,
      "info.complete": 1
    })
    .exec()
    .then(data => {
      //文件存在则返回对应的offset
      if(!!data) {
        const { info: { chunk_size, status, complete }, _id } = data
        //完成
        if(status == MEDIA_STATUS.COMPLETE) return {
          offset: size,
          id: _id.toString()
        }
  
        //分片与当前不同或状态为错误
        if(chunk != chunk_size || status == MEDIA_STATUS.ERROR) {
          return removeTemplateFolder(md5)
          .then(_ => new ImageModel(defaultModel).save())
          .then(data => ({
            offset: 0,
            id: data._id.toString()
          }))
        }
  
        //部分完成
        let unCompleteChunk = 0
        complete.sort().some((com, index) => {
          if(com != index) {
            unCompleteChunk = com
            return true
          }
          return false
        })
        unCompleteChunk ++
        unCompleteChunk *= chunk_size
        return {
          offset: unCompleteChunk >= size ? size : unCompleteChunk,
          id: _id.toString()
        }
  
      }
      //文件不存在则创建
      else {
        return new ImageModel(defaultModel).save()
        .then(data => ({
          offset: 0,
          id: data._id.toString()
        }))
      }
    })
    .catch(err => {
      console.log(err)
      return false
    })
  
  },
  videoMediaDeal: ({
    ctx,
    metadata,
    user
  }) => {
    const { md5, auth, size, mime, name, chunk } = metadata
    const { roles, _id } = user
    const origin_type = roles === ROLES_MAP.SUPER_ADMIN ? MEDIA_ORIGIN_TYPE.SYSTEM : MEDIA_ORIGIN_TYPE.USER
  
    const defaultModel = {
      name: name || '',
      src: path.join('static', auth.toLowerCase(), 'video', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      auth,
      info: {
        md5,
        complete: [],
        chunk_size: chunk,
        size,
        mime,
        status: MEDIA_STATUS.UPLOADING
      },
    }
  
    return VideoModel.findOne({
      "info.md5": md5,
      "info.mime": mime,
      "info.size": size
    }, {
      $addtoset: {
        white_list: [ _id ]
      }
    })
    .select({
      "info.chunk_size": 1,
      "info.status": 1
    })
    .exec()
    .then(data => {
      //文件存在则返回对应的offset
      if(!!data) {
        const { info: { chunk_size, status }, _id } = data
        //完成
        if(status == MEDIA_STATUS.COMPLETE) return {
          offset: size,
          id: _id.toString()
        }
  
        //分片与当前不同或状态为错误
        if(chunk != chunk_size || status == MEDIA_STATUS.ERROR) {
          return removeTemplateFolder(md5)
          .then(_ => new VideoModel(defaultModel).save())
          .then(data => ({
            offset: 0,
            id: data._id.toString()
          }))
        }
  
        //部分完成
        let unCompleteChunk = 0
        complete.sort().some((com, index) => {
          if(com != index) {
            unCompleteChunk = com
            return true
          }
          return false
        })
        unCompleteChunk ++
        unCompleteChunk *= chunk_size
        return {
          offset: unCompleteChunk >= size ? size : unCompleteChunk,
          id: _id.toString()
        }
  
      }
      //文件不存在则创建
      else {
        return new VideoModel(defaultModel).save()
        .then(data => ({
          offset: 0,
          id: data._id.toString()
        }))
      }
    })
    .catch(err => {
      console.log(err)
      return false
    })
  },
  otherMediaDeal: ({
    ctx,
    metadata,
    user
  }) => {
    const { md5, auth, size, mime, name, chunk } = metadata
    const { roles, _id } = user
    const origin_type = roles === ROLES_MAP.SUPER_ADMIN ? MEDIA_ORIGIN_TYPE.SYSTEM : MEDIA_ORIGIN_TYPE.USER
  
    const defaultModel = {
      name: name || '',
      src: path.join('static', auth.toLowerCase(), 'video', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      auth,
      info: {
        md5,
        complete: [],
        chunk_size: chunk,
        size,
        mime,
        status: MEDIA_STATUS.UPLOADING
      },
    }
  
    return OtherMediaModel.findOne({
      "info.md5": md5,
      "info.mime": mime,
      "info.size": size
    }, {
      $addtoset: {
        white_list: [ _id ]
      }
    })
    .select({
      "info.chunk_size": 1,
      "info.status": 1
    })
    .exec()
    .then(data => {
      //文件存在则返回对应的offset
      if(!!data) {
        const { info: { chunk_size, status }, _id } = data
        //完成
        if(status == MEDIA_STATUS.COMPLETE) return {
          offset: size,
          id: _id.toString()
        }
        
        //分片与当前不同或状态为错误
        if(chunk != chunk_size || status == MEDIA_STATUS.ERROR) {
          return removeTemplateFolder(md5)
          .then(_ => new OtherMediaModel(defaultModel).save())
          .then(data => ({
            offset: 0,
            id: data._id.toString()
          }))
        }
  
        //部分完成
        let unCompleteChunk = 0
        complete.sort().some((com, index) => {
          if(com != index) {
            unCompleteChunk = com
            return true
          }
          return false
        })
        unCompleteChunk ++
        unCompleteChunk *= chunk_size
        return {
          offset: unCompleteChunk >= size ? size : unCompleteChunk,
          id: _id.toString()
        }
  
      }
      //文件不存在则创建
      else {
        return new OtherMediaModel(defaultModel).save()
        .then(data => ({
          offset: 0,
          id: data._id.toString()
        }))
      }
    })
    .catch(err => {
      console.log(err)
      return false
    })
  }
}

//head请求处理
const headRequestDeal = async ({
  ctx,
  metadata,
  user
}) => {

  const { mime } = metadata
  const { roles } = user
  const role = findMostRole(roles)
  const newUser = {
    ...user,
    roles: role
  }

  const mimeType = Mime.getType(mime)
  if(/image\/.+/.test(mimeType)) {
    return headRequestMediaDeal.imageMediaDeal({
      ctx,
      metadata,
      user: newUser
    })
  }else if(/video\/.+/.test(mimeType)) {
    return headRequestMediaDeal.videoMediaDeal({
      ctx,
      metadata,
      user: newUser
    })
  }else {
    return headRequestMediaDeal.otherMediaDeal({
      ctx,
      metadata,
      user: newUser
    })
  }

}

module.exports = {
  headRequestDeal
}