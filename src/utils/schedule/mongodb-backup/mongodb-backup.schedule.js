const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const path = require('path')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const { exec } = require('child_process')
const dayjs = require('dayjs')
const fs = require('fs-extra')
const { sendMail } = require('../../email')
const { EMAIL_AUTH } = require('../../constant')
/** 
 * 定时备份mongodb数据
*/

const TEMPLATE_MAIL = {
  from: EMAIL_AUTH.email,
  subject: '树莓派数据备份',
  to: process.env.BACKUP_EMAIL,
}

async function scheduleMethod({
  test = false
} = {}) {

  console.log(chalk.yellow(CacheJson.mongodbBackupSchedule.description))

  try {

    await fs.remove(path.join(__dirname, '../../../../mongodb-backup.gz')) 

    await new Promise((resolve, reject) => {
      exec(`docker ps -q --filter "name=mongo"`, (err, stdout, stderr) => {
        if(err) {
          reject(err)
        }else {
          console.log()
          resolve(stdout.trim())
        }
      })
    })
    .then(data => {
      return new Promise((resolve, reject) => {
        exec(`docker exec ${data} mongodump --archive --gzip > mongodb-backup.gz`, (err) => {
          if(err) {
            reject(err)
          }else {
            resolve()
          }
        })
      })
    })
    .then(() => {
      sendMail({
        ...TEMPLATE_MAIL,
        html: `<h1>${dayjs().format('YYYY-MM-DD')}的mongodb备份</h1>`,
        attachments: [
          {
            filename: 'mongodb-backup.gz',
            path: path.join(__dirname, '../../../../mongodb-backup.gz')
          },
        ]
      }, err => {
        console.error(err)
      })
    })
  } catch (err) {
    !test && log4Error({
      __request_log_id__: CacheJson.mongodbBackupSchedule.description
    }, err)
  }

}

const mongodbBackupSchedule = () => {
  const { name, time } = CacheJson.mongodbBackupSchedule
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule
}

module.exports = {
  schedule: mongodbBackupSchedule,
  scheduleMethod
}