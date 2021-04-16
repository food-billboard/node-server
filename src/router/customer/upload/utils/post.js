const Mime = require('mime')
const path = require('path')
const { ImageModel, VideoModel, OtherMediaModel, findMostRole, ROLES_MAP, MEDIA_ORIGIN_TYPE, MEDIA_STATUS } = require('@src/utils')
const { removeTemplateFolder } = require('./head')

const postRequestMediaDeal = {
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
      src: path.join('static', 'image', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      origin: _id,
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

    return ImageModel.deleteOne({
      "info.md5": md5,
    })
    .then(_ => new ImageModel(defaultModel).save())
    .then(_ => true)
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
      src: path.join('static', 'video', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      auth,
      origin: _id,
      info: {
        md5,
        complete: [],
        chunk_size: chunk,
        size,
        mime,
        status: MEDIA_STATUS.UPLOADING
      },
    }
  
    return VideoModel.deleteOne({
      "info.md5": md5,
    })
    .then(_ => new VideoModel(defaultModel).save())
    .then(_ => true)
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
      src: path.join('static', 'other', `${md5}.${Mime.getExtension(mime)}`),
      origin_type,
      white_list: [_id],
      auth,
      origin: _id,
      info: {
        md5,
        complete: [],
        chunk_size: chunk,
        size,
        mime,
        status: MEDIA_STATUS.UPLOADING
      },
    }
  
    return OtherMediaModel.deleteOne({
      "info.md5": md5,
    })
    .then(_ => new OtherMediaModel(defaultModel).save())
    .then(_ => true)
    .catch(err => {
      console.log(err)
      return false
    })

  }
} 

const postMediaDeal = async ({
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

  //删除之前存在的临时文件
  try {
    await removeTemplateFolder(metadata.md5)
  }catch(err) {}

  const mimeType = mime.toLowerCase()
  if(/image\/.+/.test(mimeType)) {
    return postRequestMediaDeal.imageMediaDeal({
      ctx,
      metadata,
      user: newUser
    })
  }else if(/video\/.+/.test(mimeType)) {
    return postRequestMediaDeal.videoMediaDeal({
      ctx,
      metadata,
      user: newUser
    })
  }else {
    return postRequestMediaDeal.otherMediaDeal({
      ctx,
      metadata,
      user: newUser
    })
  }

}

module.exports = {
  postMediaDeal
}