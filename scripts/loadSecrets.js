const fs = require('fs-extra')
const path = require('path')
const { program } = require('commander')
const { merge } = require('lodash')

program
  .option('--code <letters>', 'select some code to write the code file')
  .option('--key <letters>', 'confirm the code key')
  .option('--des <letters>', 'description')

program.parse()

const { code, key, des } = program.opts()

if(!!code && !!key) {
  const filePath = path.join(__dirname, '../', 'public/secrets/index.json')
  const exists = fs.existsSync(filePath)
  let fileData = "{}"
  if(exists) {
    fileData = fs.readFileSync(filePath)
  }
  const fileDataObject = JSON.parse(fileData)
  fileDataObject[key] = merge({}, fileDataObject[key], {
    code,
    description: des 
  })
  fs.writeJSONSync(filePath, fileDataObject)
}
