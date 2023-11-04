const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const { FRONT_END_PACKAGE_PATH } = require('@src/utils')
// 模块是否存在
const isFolderExist = (folder) => {
  return fs.existsSync(path.join(FRONT_END_PACKAGE_PATH, folder))
}

// 删除模块
const removePackage = (folder) => {
  try {
    fs.rmdirSync(path.join(FRONT_END_PACKAGE_PATH, folder))
    return true 
  }catch(err) {
    return false 
  }
}

// 创建模块
const createPackage = async (url, folder, wait=false) => {
  try {
    // 模块名称
    const [ packageName ] = url.split('/').slice(-1)[0].split('.git')
    // 实际模块的存放路径
    const packagePath = path.join(FRONT_END_PACKAGE_PATH, folder)
    // 临时存放目录
    const templateFolder = path.join(FRONT_END_PACKAGE_PATH, 'template')
    // 临时存放的模块的目录
    const templateInternalFolder = path.join(templateFolder, packageName)
    // 打包目录名称
    let distName = 'dist'

    if(wait) {
      return fs.mkdirp(packagePath)
    }

    fs.mkdirpSync(templateFolder)

    // git clone 
    await new Promise((resolve, reject) => {
      exec(`git clone ${url}`, {
        cwd: templateFolder
      }, err => {
        if(err) {
          reject(err)
        }else {
          resolve()
        }
      })
    })

    // install & build 
    await new Promise((resolve, reject) => {
      exec(`npm install && npm run build`, {
        cwd: templateInternalFolder
      }, err => {
        if(err) {
          reject(err)
        }else {
          resolve()
        }
      })
    })

    if(fs.existsSync(path.join(templateInternalFolder, 'build'))) distName = 'build'

    // rename & move 
    fs.renameSync(path.join(templateFolder, packageName, distName), packagePath)

    // remove 
    fs.rmdirSync(templateInternalFolder)
    
  }catch(err) {
    console.log(err)
  }
}

// 修改模块名称
const updatePackageFolder = (folder, previousFolder) => {
  try {
    fs.renameSync(path.join(FRONT_END_PACKAGE_PATH, previousFolder), path.join(FRONT_END_PACKAGE_PATH, folder))
  }catch(err) {}
}

module.exports = {
  removePackage,
  isFolderExist,
  createPackage,
  updatePackageFolder
}
