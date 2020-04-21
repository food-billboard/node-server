const MongoClient = require('mongodb').MongoClient
const MongoId = require('mongodb').ObjectID
const $create = require('./create')
const $delete = require('./delete')
const $find = require('./find')
const $insert = require('./insert')
const $update = require('./update')

const { isType, isEmpty, flat } = require('../tool')

const url = ''

//连接
function connect() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if(err) {
        reject(err)
      }
      resolve(db)
    })
  })
}

class MongoDB {

  static instance

  url

  mongoName

  // timer = {
  //   derail: 1,
  //   time: 5000,
  //   start: (callback=()=>{}) => {
  //     this.timer.close()
  //     this.timer.derail = setTimeout(() => {
  //       callback()
  //     }, this.timer.time)
  //   },
  //   close: (callback=()=>{}) => {
  //     clearTimeout(this.timer.derail)
  //     callback()
  //   }
  // }

  // connected = false

  constructor(url, name) {
    if(!this.instance) {
      this.instance = new MongoDB(url, name)
      return this
    }
    this.url = url
    this.mongoName = name
    return this.instance
  }

  //数据库连接
  connect() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if(err) {
          reject(err)
        }
        resolve(db)
      })
    })
  }

  //创建集合
  createCollection(collectionName, options={}) {
    this.connect()
    .then(db=> {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
        dataBase.createCollection(collectionName, function(err, res) {
          if(err) {
            reject(err)
          }
          resolve(res)
        })
      })
    }).catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  insert(collectionName, ...datas) {
    if(isEmpty(datas)) return Promise.reject('can not insert empty data')
    this.insertInternal(collectionName, flat(datas))
  }

  //插入数据
  insertInternal(collectionName, data) {
    this.connect()
    .then(db=> {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
        dataBase.collection(collectionName)
        .insertMany(data, function(err, res) {
          if(err) {
            reject(err)
          }
          resolve(res)
        })
      })
    }).catch(err => {
      console.log('fail connect: ' + err)
    })
  } 

  //查找数据
  find(collectionName, rules) {
    const data = this.findInternal(collectionName, rules)
    return new Promise((resolve, reject) => {
      data.toArray(function(err, res) {
        if(err) {
          reject(err)
        }else {
          resolve(res)
        }
      })
    })
  }

  findInternal(collectionName, rules) {
    rules = isType(rules, 'object') ? rules : {}
    this.connect()
    .then(db => {
      const {
        query,
        ...nextRules
      } = rules
      const dataBase = db.db(collectionName)

      let data = dataBase.find(nextRules)

      if(!isType(query, 'array')) return data
      query.forEach(item => {
        if(!isType(item, 'object') || isEmpty(item) || !('type' in item)) return
        const {
          type,
          ...args
        } = item
        data = data[type](...args)
      })

      return data
 
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  updateOne(collectionName, rules, data) {
    if(isEmpty(data)) return Promise.reject('can not insert empty data')
    this.connect()
    .then(db => {
      const dataBase = db.db(collectionName)
      return this.update(dataBase.collection(collectionName), rules, data)
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  updateMany(collectionName, rules, ...datas) {
    if(isEmpty(datas)) return Promise.reject('can not insert empty data')
    this.connect()
    .then(db => {
      const dataBase = db.db(collectionName)
      return this.update(dataBase.collection(collectionName), rules, flat(datas))
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  //更新数据
  update(collection, rules, data, updateOne) {
    const method = updateOne ? 'updateOne' : 'updateMany'
    return new Promise((resolve, reject) => {
      collection[method](rules, data, function(err, res) {
        if(err) {
          reject(err)
        }else {
          resolve(res)
        }
      })
    })
  }

  deleteOne(collectionName, rules) {
    this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.delete(dataBase.collection(collectionName, rules))
    }) 
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  deleteMany(collectionName, rules) {
    this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.delete(dataBase.collection(collectionName, rules, false))
    }) 
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  //删除数据
  delete(collection, rules,  deleteOne=true) {
    const method = deleteOne ? 'deleteOne' : 'deleteMany'
    return new Promise((resolve, reject) => {
      collection[method](rules, function(err, res) {
        if(err) {
          reject(err)
        }
        resolve(res)
      })
    })
  }

  delArgs(rules, queryConfig, name) {
    rules = isType(rules, 'object') ? rules : {}
    queryConfig = isType(queryConfig, 'object') ? queryConfig : {}
    const {
      query=[],
      ...nextRules
    } = rules
    if(!isEmpty(queryConfig)) {
      query.push({
        type: name,
        ...queryConfig
      })
    }
    return {
      query,
      rules: nextRules
    }
  }

  //排序
  sort(collectionName, rules, sort) {

    const { query, rules } = this.delArgs(rules, sort, 'sort')

    const data = this.findInternal(collectionName, {
      ...rules,
      query
    })
    return new Promise((resolve, reject) => {
      data.toArray(function(err, res) {
        if(err) {
          reject(err)
        }else {
          resolve(res)
        }
      })
    })

  }

  //跳过数据
  skip(collectionName, rules, skip) {

    const { query, rules } = this.delArgs(rules, skip, 'skip')

    const data = this.findInternal(collectionName, {
      ...rules,
      query
    })
    return new Promise((resolve, reject) => {
      data.toArray(function(err, res) {
        if(err) {
          reject(err)
        }else {
          resolve(res)
        }
      })
    })
  }

  //限制数量
  limit(collectionName, rules, limit) {

    const { query, rules } = this.delArgs(rules, limit, 'limit')
    const data = this.findInternal(collectionName, {
      ...rules,
      query
    })
    return new Promise((resolve, reject) => {
      data.toArray(function(err, res) {
        if(err) {
          reject(err)
        }else {
          resolve(res)
        }
      })
    })

  }

}

module.exports = MongoDB

/**
 * 连接数据库
 * 查找数据
 * 删除数据
 * 更新数据
 * 排序数据
 * 插入数据 
 * 限制查询数量 db.find().limit(num)
 * 跳过指定数量 db.find().skip(num)
 * 
 * 删除集合 db.collection(name).drop(function(err,res){})
 * 查找第一条 db.findOne
 * 统计 db.find().count()
 * 删除数据库 创建数据库
 * 索引设置 查看 删除 唯一索引 创建 
 * 聚合
 * 
 * 分片
 * 复制
 * 备份恢复
 * 监控
 */
