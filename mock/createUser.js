
const { Command } = require('commander')
const chalk = require('chalk')
const mongoose = require("mongoose")
const { UserModel } = require('../src/utils/mongodb/mongo.lib')
const { mergeConfig } = require('../src/utils/tool')
const { encoded } = require('../src/utils/token')

const { Types: { ObjectId } } = mongoose 

function createMobile() {
  return parseInt(`13${new Array(9).fill(0).map(_ => Math.floor(Math.random() * 10)).join('')}`)
}

function mockCreateUser(values={}) {
  const { password: definePassword, mobile: defineMobile, ...nextValues } = values 
  const password = definePassword || '1234567890'
  const mobile = parseInt(defineMobile) || createMobile()
  const encodedPwd = encoded(password)
  // const token = signToken({ mobile, id }, {expiresIn: '5s'})
  let baseModel = {
    mobile,
    email: `${mobile}@163.com`,
    password: encodedPwd,
    username: '测试默认名称',
    avatar: ObjectId('5edb3c7b4f88da14ca419e61'),
    hot: 0,
    fans: [],
    attentions: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    rate: [],
    allow_many: false,
    status: 'SIGNOUT',
    roles: [ 'SUPER_ADMIN' ]
  }
  baseModel = mergeConfig(baseModel, nextValues, true)

  const model = new UserModel(baseModel)

  return {
    model,
    decodePassword: password,
  }
}

async function createUser(values={}) {
  const { model, decodePassword } = mockCreateUser(values)

  return mongoose.connect("mongodb://127.0.0.1:27017/movie")
  .then(_ => {
    return model.save()
  })
  .then(data => {
    const { mobile, email, username } = data 
    console.log(chalk.green("创建用户成功: " + "用户名: " + username + ", 密码: " + decodePassword + ", 手机号: " + mobile + ", 邮箱: " + email))
    return mongoose.disconnect()
  })
  .catch(err => {
    console.log(chalk.red("创建用户失败"))
  })
}

const program = new Command() 

program   
  .option("-u, --username <string>", "用户名")
  .option("-p, --password <string>", "密码")
  .option("-m, --mobile <string>", "手机号")

program.parse(process.argv)

const options = program.opts()

createUser(Object.entries(options).reduce((acc, cur) => {
  const [ key, value ] = cur
  if(value !== undefined) acc[key] = value  
  return acc 
}, {}))

