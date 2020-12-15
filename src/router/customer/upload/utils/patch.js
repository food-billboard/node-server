const path = require('path')
const fs = require('fs')
const Url = require('url')
const formidable = require('formidable')
const { ImageModel, VideoModel, OtherMediaModel, notFound, STATIC_FILE_PATH, MEDIA_STATUS } = require('@src/utils')

const MEDIA_TYPE = {
  other: OtherMediaModel,
  image: ImageModel,
  video: VideoModel
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
      "info.chunks.chunk_size": 1,
      "info.size": 1
    })
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { info: { complete, chunk_size, size } } = data

      const numberOffset = parseInt(offset)
      const multiple = numberOffset / chunk_size
      if(numberOffset > size || parseInt(multiple) !== multiple) return Promise.reject({
        errMsg: 'bad request',
        status: 400
      })

      //返回文件相关信息
      const result = {
        folder: path.join(STATIC_FILE_PATH, 'template', md5, `${md5}-${multiple}`),
        model: ImageModel,
        type: 'image',
        complete: numberOffset + chunk_size >= size 
      }

      return Promise.all([
        Promise.resolve(result),
        ImageModel.updateOne({
          "info.md5": md5
        }, {
          $push: {
            "info.complete": multiple
          },
          $set: {
            "info.status": result.complete ? MEDIA_STATUS.COMPLETE : MEDIA_STATUS.UPLOADING
          }
        })
      ])

    })
    .then(([result]) => result)

  },
  video: ({
    user,
    ctx,
    md5
  }) => {

  },
  other: ({
    user,
    ctx,
    md5
  }) => {

  }
}

const patchRequestDeal = (options) => {

  const form = formidable({ multiples: true })

  return Promise.any(Object.values(pathMediaDeal).map(deal => deal(options)))
  .then(({
    folder,
    model,
    type,
    complete
  }) => {
    return new Promise((resolve, reject) => {
      form.parse(req, (err, _, files) => {
        console.log(err)
        if(err) return reject(500)
        if(!files.file) return reject(404)
        resolve(files.file)
      })
    })
    //文件保存及合并
    .then(file => {

      //全部上传
      if(complete) {

      }
      //部分上传
      else {

      }

    })  
    .then(data => {
      
    })
    .catch(err => {

      //报错则修改回文件上传状态
      const { md5 } = options
      return model.updateOne({
        "info.md5": md5
      }, {
        $set: {
          "info.status": MEDIA_STATUS.UPLOADING
        }
      })
      .then(_ => Promise.reject(err))

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