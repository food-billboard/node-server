const fs = require("fs")
const path = require("path")
const axios = require("axios")
const mime = require("mime")

async function downloadVideo(url, name, localDir) {
  let filename = name 

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  })

  const { headers } = response 
  const contentType = headers["content-type"] || headers["Content-Type"]
  const type = mime.getExtension(contentType)

  filename += `.${type}`
  const writeStream = fs.createWriteStream(path.join(localDir, filename))

  response.data.pipe(writeStream)

  return new Promise((resolve, reject) => {
    writeStream.on("finish", resolve)
    writeStream.on("error", reject)
  })
  .then(() => {
    return filename
  })
  .catch(err => {
    return ""
  })

}

module.exports = {
  downloadVideo
}