const path = require('path')
const Mime = require('mime')
const fs = require('fs').promises
const { ImageModel, VideoModel, OtherMediaModel, MEDIA_AUTH, ROLES_MAP, MEDIA_ORIGIN_TYPE, findMostRole, MEDIA_STATUS } = require('@src/utils')
const { getChunkFileList } = require('./util')

//删除临时文件
const removeTemplateFolder = (name) => {

  const folder = path.join(STATIC_FILE_PATH, 'template', name)

  return getChunkFileList(folder)
  .then(fileList => Promise.all(fileList.map(file => {
    return fs.unlink(path.join(folder, file))
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
    const origin_type = roles === ROLES_MAP.SUPER_ADMIN ? MEDIA_ORIGIN_TYPE.ORIGIN : MEDIA_ORIGIN_TYPE.USER

  
    const defaultModel = {
      name: name || md5,
      src: path.join('/static', 'image', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      origin: _id,
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
  
    /*
      如果用户上传一个已经存在且为私有的文件，
      但当前为公开的话，文件即变为公开状态
    */
    return ImageModel.findOneAndUpdate({
      // auth,
      "info.md5": md5,
      "info.mime": mime,
      "info.size": size
    }, {
      $addToSet: {
        white_list: _id
      },
      ...(
        auth.toUpperCase() === MEDIA_AUTH.PUBLIC ? {
          $set: {
            auth: MEDIA_AUTH.PUBLIC
          }
        } : {}
      )
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
        if(status == MEDIA_STATUS.COMPLETE && !complete.length) return {
          offset: size,
          id: _id.toString(),
          size
        }
  
        //分片与当前不同或状态为错误
        if(chunk != chunk_size || status == MEDIA_STATUS.ERROR) {
          return removeTemplateFolder(md5)
          .then(_ => new ImageModel(defaultModel).save())
          .then(data => ({
            offset: 0,
            id: data._id.toString(),
            size
          }))
        }
  
        //部分完成
        let unCompleteChunk = -1;
        
        ([...complete]).sort((a, b) => a - b).some((com, index) => {
          if(com != index) {
            unCompleteChunk = com
            return true
          }
          return false
        })

        if(!~unCompleteChunk) unCompleteChunk = complete.length
        // unCompleteChunk ++
        unCompleteChunk *= chunk_size
        return {
          offset: unCompleteChunk >= size ? size : unCompleteChunk,
          id: _id.toString(),
          size
        }
  
      }
      //文件不存在则创建
      else {
        return new ImageModel(defaultModel).save()
        .then(data => ({
          offset: 0,
          id: data._id.toString(),
          size
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
    const origin_type = roles === ROLES_MAP.SUPER_ADMIN ? MEDIA_ORIGIN_TYPE.ORIGIN : MEDIA_ORIGIN_TYPE.USER

    const defaultModel = {
      name: name || md5,
      src: path.join('/static', 'video', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      origin: _id,
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
  
    return VideoModel.findOneAndUpdate({
      "info.md5": md5,
      "info.mime": mime,
      "info.size": size
    }, {
      $addToSet: {
        white_list: _id
      }
    })
    .select({
      "info.chunk_size": 1,
      "info.status": 1,
      "info.complete": 1,
    })
    .exec()
    .then(data => {
      //文件存在则返回对应的offset
      if(!!data) {
        const { info: { chunk_size, status, complete }, _id } = data
  
        //完成
        if(status == MEDIA_STATUS.COMPLETE && !complete.length) return {
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
        let unCompleteChunk = -1;

        ([...complete]).sort((a, b) => a - b).some((com, index) => {
          if(com != index) {
            unCompleteChunk = com
            return true
          }
          return false
        })

        if(!~unCompleteChunk) unCompleteChunk = complete.length

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
    const origin_type = roles === ROLES_MAP.SUPER_ADMIN ? MEDIA_ORIGIN_TYPE.ORIGIN : MEDIA_ORIGIN_TYPE.USER
  
    const defaultModel = {
      name: name || md5,
      src: path.join('/static', 'video', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      origin: _id,
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
  
    return OtherMediaModel.findOneAndUpdate({
      "info.md5": md5,
      "info.mime": mime,
      "info.size": size
    }, {
      $addToSet: {
        white_list: _id
      }
    })
    .select({
      "info.chunk_size": 1,
      "info.status": 1,
      "info.complete": 1,
    })
    .exec()
    .then(data => {
      //文件存在则返回对应的offset
      if(!!data) {
        const { info: { chunk_size, status, complete }, _id } = data
        //完成
        if(status == MEDIA_STATUS.COMPLETE && !complete.length) return {
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
        let unCompleteChunk = -1;
        ([...complete]).sort((a, b) => a - b).some((com, index) => {
          if(com != index) {
            unCompleteChunk = com
            return true
          }
          return false
        })
        // unCompleteChunk ++
        if(!~unCompleteChunk) unCompleteChunk = complete.length
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
  const mimeType = mime.toLowerCase()
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
  headRequestDeal,
  removeTemplateFolder
}