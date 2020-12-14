const path = require('path')
const fs = require('fs')
const Url = require('url')
const formidable = require('formidable')
const { ImageModel, VideoModel, OtherMediaModel } = require('@src/utils')

const MEDIA_TYPE = [ 'other', 'image', 'video' ]

const pathMediaDeal = {
  image: () => {

  },
  video: () => {

  },
  other: () => {

  }
}

const patchRequestDeal = ({
  user,
  ctx,
  metadata
}) => {

  const form = formidable({ multiples: true })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, _, files) => {
      console.log(err)
      if(err) return reject(500)
      if(!files.file) return reject(404)
      resolve(files.file)
    })
  })
  .then(file => {

  })  
  .catch(err => {
    console.log(err)

  })

}

module.exports = {
  patchRequestDeal,
  MEDIA_TYPE
}