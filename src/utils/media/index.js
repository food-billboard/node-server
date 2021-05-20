const { Types: { ObjectId } } = require('mongoose')
const { ImageModel, VideoModel, OtherMediaModel } = require('../mongodb/mongo.lib')
const { parseData } = require('../error-deal')
const { DEVELOPMENT_API_DOMAIN, PRODUCTION_API_DOMAIN } = require('../constant')

const MEDIA_MODEL_MAP = {
  image: ImageModel,
  video: VideoModel,
  other: OtherMediaModel
}

function reg(content) {
  return {
    $regex: content,
    $options: 'gi'
  }
}

async function findMediaInfo(content, type, select) {
  const model = MEDIA_MODEL_MAP[type]
  if(!model) return {}

  let srcContent = content
  if(srcContent.startWidth(DEVELOPMENT_API_DOMAIN)) {
    srcContent.replace(DEVELOPMENT_API_DOMAIN, '')
  }else if(srcContent.startWidth(PRODUCTION_API_DOMAIN)) {
    srcContent.replace(PRODUCTION_API_DOMAIN, '')
  }

  let query = [
    {
      src: reg(srcContent)
    },
    {
      "info.md5": reg(content)
    },
    {
      name: reg(content)
    }
  ]
  if(ObjectId.isValid(content)) query.push({
    _id: ObjectId(content)
  })
  const selectData = select || {
    _id: 1,
    src: 1,
    "info.md5": 1
  }

  return model.findOne({
    $or: query
  })
  .select(selectData)
  .exec()
  .then(parseData)
  .catch(err => {
    return {}
  })
}

module.exports = {
  findMediaInfo,
  MEDIA_MODEL_MAP
}