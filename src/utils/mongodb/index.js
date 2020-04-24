const MongoClient = require('mongodb').MongoClient
const MongoId = require('mongodb').ObjectID

//查找选择性返回

const { isType, isEmpty, flat } = require('../tool')

class MongoDB {

  static instance

  //数据库地址
  url

  //数据库名称
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
    if(this.instance) return this.instance
    this.instance = this
    this.url = url
    this.mongoName = name
  }

  //数据库连接 | 创建
  connect() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.url, { useNewUrlParser: true }, function(err, db) {
        if(err) {
          reject(err)
        }
        resolve(db)
      })
    })
  }

  //删除数据库
  deleteMongo() {
    return this.connect()
    .then(db => {
      return new Promise((resolve, reject) => {
        db.dropDataBase(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  //创建集合
  createCollection(collectionName, options={}) {
    return this.connect()
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

  //删除集合
  deleteCollection(collectionName) {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
        dataBase.collection(collectionName).drop(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  insert(collectionName, ...datas) {
    if(isEmpty(datas)) return Promise.reject('can not insert empty data')
    return this.insertInternal(collectionName, flat(datas))
  }

  //插入数据
  insertInternal(collectionName, data) {
    return this.connect()
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
    return this.findInternal(collectionName, rules).then(data => {
      return new Promise((resolve, reject) => {
        data.toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    })
  }

  //查找一条
  findOne(collectionName, rules) {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
       let collection = dataBase.collection(collectionName)
       let hasFindOne = !!collection.findOne
       if(hasFindOne) {
        collection.findOne(rules).toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
       }else {
        this.findInternal(collectionName, { ...rules, query: [ { type: 'limit', 1:1 } ] }).then(data => {
          data.toArray(function(err, res) {
            if(err) {
              reject(err)
            }else {
              resolve(res)
            }
          })
        })
       }
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  findInternal(collectionName, rules) {
    rules = isType(rules, 'object') ? rules : {}
    return this.connect()
    .then(db => {
      const {
        query,
        ...nextRules
      } = rules
      const dataBase = db.db(this.mongoName)

      let data = dataBase.collection(collectionName).find(nextRules)

      if(!isType(query, 'array')) return data
      query.forEach(item => {
        if(!isType(item, 'object') || !isType(item, 'array') || isEmpty(item)) return 
        if(isType(item, 'object') && 'type' in item) {
          const {
            type,
            ...args
          } = item
          data = data[type](...args)
        }else if(isType(item, 'array')) {
          const type = item.slice(0, 1)
          const args = item.slice(1)
          data = data[type](...args)
        }
      })

      return data
 
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  updateOne(collectionName, rules, data) {
    if(isEmpty(data)) return Promise.reject('can not insert empty data')
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.update(dataBase.collection(collectionName), rules, data)
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  updateMany(collectionName, rules, ...datas) {
    if(isEmpty(datas)) return Promise.reject('can not insert empty data')
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
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
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.delete(dataBase.collection(collectionName, rules))
    }) 
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  deleteMany(collectionName, rules) {
    return this.connect()
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
      if(!isType(queryConfig, 'object')) {
        query.push([
          name,
          queryConfig
        ])
      }else {
        query.push({
          type: name,
          ...queryConfig
        })
      }
    }
    return {
      query,
      rules: nextRules
    }
  }

  //排序
  sort(collectionName, rules, sort) {

    const { query, rules:detailRules } = this.delArgs(rules, sort, 'sort')

    return this.findInternal(collectionName, {
      ...detailRules,
      query
    }).
    then(data => {
      return new Promise((resolve, reject) => {
        data.toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    }).
    catch(err => {
      console.log('something error: ' + err)
    })

  }

  //跳过数据
  skip(collectionName, rules, skip) {

    const { query, rules:detailRules } = this.delArgs(rules, skip, 'skip')

    return this.findInternal(collectionName, {
      ...detailRules,
      query
    }).
    then(data => {
      return new Promise((resolve, reject) => {
        data.toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    }).
    catch(err => {
      console.log('something error: ' + err)
    })
  }

  //限制数量
  limit(collectionName, rules, limit) {

    const { query, rules:detailRules } = this.delArgs(rules, limit, 'limit')
    return this.findInternal(collectionName, {
      ...detailRules,
      query
    }).
    then(data => {
      return new Promise((resolve, reject) => {
        data.toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    }).
    catch(err => {
      console.log('something error: ' + err)
    })

  }

  //查询总数
  count(collectionName, rules) {
    return this.findInternal(collectionName, rules)
    .then(data => {
      return new Promise((resolve, reject) => {
        let _data = data
        data.toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve({
              data: res,
              count: _data.count ? _data.count() : res.length
            })
          }
        })
      })
    })
    .catch(err => {
      console.log('something error: ' + err)
    }) 
  }

  //查看索引
  getIndexInfo(collectionName, type="list") {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName).collection(collectionName)
      return new Promise((resolve, reject) => {
        switch(type) {
          case 'size':
            dataBase.totalIndexSize(function(err, res) {
              if(err) {
                reject(err)
              }else {
                resolve(res)
              }
            })
            break
          case 'list':
          default: 
            dataBase.getIndexs(function(err, res) {
              if(err) {
                reject(err)
              }else {
                resolve(res)
              }
            })
        }
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  //删除索引
  dropIndex(collectionName, name=undefined) {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
        let collection = dataBase.collection(collectionName)
        if(name) {
          collection.dropIndex(name, function(err, res) {
            if(err) {
              reject(err)
            }else {
              resolve(res)
            }
          })
        }else {
          collection.dropIndex(function(err, res) {
            if(err) {
              reject(err)
            }else {
              resolve(res)
            }
          })
        }
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  //创建索引
  createIndex(collectionName, rules, options={}) {
    let method
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName).collection(collectionName)
      const isBefore3 = !!!dataBase.createIndex
      method = isBefore3 ? 'ensureIndex' : 'createIndex'
      return new Promise((resolve, reject) => {
        dataBase[method](rules, options, function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(res)
          }
        })
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  //聚合
  aggregate(collectionName, args) {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      dataBase.collection(collectionName).aggregate(args)
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  //id获取

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
 * 索引查看 删除 唯一索引 创建 
 * 聚合
 * 
 * 分片
 * 复制
 * 备份恢复
 * 监控
 */

// 集合中索引不能超过64个
// 索引名的长度不能超过128个字符
// 一个复合索引最多可以有31个字段
//控制集合中的索引，当索引数量超过最大值时自动删除最先添加的索引
//长度超过时自动截断
//超出字段默认自动截断
