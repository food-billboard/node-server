const { ImageModel, VideoModel, OtherMediaModel } = require('@src/utils')

const MEDIA_MAP = {
  0: ImageModel,
  1: VideoModel,
  2: OtherMediaModel
}

module.exports = {
  MEDIA_MAP
}