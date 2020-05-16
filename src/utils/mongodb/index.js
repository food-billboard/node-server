const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const { isType, isEmpty, flat } = require('../tool')

class MongoDB {

  static instance

  //数据库地址
  url

  //数据库名称
  mongoName

  constructor(url, name) {
    if(this.instance) return this.instance
    this.instance = this
    this.url = url
    this.mongoName = name
  }

  //数据库连接 | 创建
  connect = () => {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.url, 
      { 
        useNewUrlParser: true,
        useUnifiedTopology: true  
      }, 
      function(err, db) {
        if(err) {
          reject(err)
        }
        resolve(db)
      })
    })
  }

  //删除数据库
  deleteMongo = () => {
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
  createCollection = (collectionName, options={}) => {
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
  deleteCollection = (collectionName) => {
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

  insert = (collectionName, ...datas) => {
    if(isEmpty(datas)) return Promise.reject('can not insert empty data')
    return this.insertInternal(collectionName, flat(datas))
  }

  //插入数据
  insertInternal = (collectionName, data) => {
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
  find = (collectionName, rules={}, returnWhat={}) => {
    return this.findInternal(collectionName, rules, returnWhat).then(data => {
      return new Promise((resolve, reject) => {
        if(!data) {
          reject('something error')
        }else {
          data.toArray(function(err, res) {
            if(err) {
              reject(err)
            }else {
              resolve(res)
            }
          })
        }
      })
    })
  }

  //查找一条
  findOne = (collectionName, rules={}, returnWhat={}) => {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
       let collection = dataBase.collection(collectionName)
       let hasFindOne = !!collection.findOne
       if(hasFindOne) {
        collection.findOne(rules).then(res => resolve(res)).catch(err => reject(err))
       }else {
        this.findInternal(collectionName, rules, returnWhat).then(data => {
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

  findInternal = (collectionName, rules={}, returnWhat={}) => {
    rules = isType(rules, 'object') ? rules : {}
    return this.connect()
    .then(db => {
      const {
        query,
        ...nextRules
      } = rules
      const dataBase = db.db(this.mongoName)
      let data = dataBase.collection(collectionName).find(nextRules)
      if(!isType(query, 'array')) return data.project(returnWhat)
      query.forEach(item => {
        if(!isType(item, 'object') && !isType(item, 'array') && isEmpty(item)) return 
        if(isType(item, 'object') && ('__type__' in item)) {
          const {
            __type__,
            ...args
          } = item
          data = data[__type__](args)
        }else if(isType(item, 'array')) {
          const type = item.slice(0, 1)
          const args = item.slice(1)
          data = data[type](...args)
        }
      })
      return data.project(returnWhat)
 
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  updateOne = (collectionName, rules, data) => {
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

  updateMany = (collectionName, rules, datas) => {
    if(isEmpty(datas)) return Promise.reject('can not insert empty data')
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.update(dataBase.collection(collectionName), rules, datas, false)
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  //更新数据
  update = (collection, rules, data, updateOne=true) => {
    const method = updateOne ? 'updateOne' : 'updateMany'
    return new Promise((resolve, reject) => {
      collection[method](rules, data, function(err, res) {
        if(err) {
          reject(err)
        }else {
          resolve(res.result)
        }
      })
    })
  }

  deleteOne = (collectionName, rules={}) => {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.delete(dataBase.collection(collectionName), rules)
    }) 
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  deleteMany = (collectionName, rules={}) => {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return this.delete(dataBase.collection(collectionName), rules, false)
    }) 
    .catch(err => {
      console.log('fail connect: ' + err)
    }) 
  }

  //删除数据
  delete = (collection, rules,  deleteOne=true) => {
    const method = deleteOne ? 'deleteOne' : 'deleteMany'
    return new Promise((resolve, reject) => {
      collection[method](rules, function(err, res) {
        if(err) {
          reject(err)
        }
        resolve(res.result)
      })
    })
  }

  delArgs = (rules, queryConfig, name) => {
    rules = isType(rules, 'object') ? rules : {}
    
    const {
      query=[],
      ...nextRules
    } = rules
    let newQuery = [...query]
    if(!isEmpty(queryConfig)) {
      //非对象数据
      if(!isType(queryConfig, 'object')) {
        if(isEmpty(newQuery)) {
          newQuery.push([
            name,
            queryConfig
          ])
        }else {
          newQuery = newQuery.map(item => {
            //queryConfig类型不与query中相同时不予考虑
            if(isType(item, 'array')) {
              let [type] = item.slice(0, 1)
              if(type === name) item = [type, queryConfig]
            }
            return item
          })
        }
      //对象数据
      }else {
        if(isEmpty(newQuery)) {
          newQuery.push({
            __type__: name,
            ...queryConfig
          }) 
        }else {
          newQuery = newQuery.map(item => {
            if(isType(item, 'object')) {
              const { __type__ } = item
              if(__type__ === name) item = { ...item, ...queryConfig }
            }
            return item
          })
        }
      }
    }
    return {
      query: newQuery,
      rules: nextRules
    }
  }

  //排序
  sort = (collectionName, sort, rules={}, returnWhat={}) => {

    const { query, rules:detailRules } = this.delArgs(rules, sort, 'sort')

    return this.findInternal(collectionName, {
      ...detailRules,
      query
    },
    returnWhat).
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
  skip = (collectionName, skip, rules={}, returnWhat={}) => {

    const { query, rules:detailRules } = this.delArgs(rules, skip, 'skip')
    
    return this.findInternal(collectionName, {
      ...detailRules,
      query
    },
    returnWhat).
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
  limit = (collectionName, limit, rules={}, returnWhat={}) => {

    const { query, rules:detailRules } = this.delArgs(rules, limit, 'limit')
    
    return this.findInternal(collectionName, {
      ...detailRules,
      query
    }, returnWhat).
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
  count = (collectionName, rules={}) => {
    return this.findInternal(collectionName, rules)
    .then(data => {
      return data.count()
    })
    .catch(err => {
      console.log('something error: ' + err)
    }) 
  }

  //查看索引(无效)
  getIndexInfo = (collectionName, type="list") => {
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

  //删除索引(无效)
  dropIndex = (collectionName, name=undefined) => {
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

  //创建索引(无效)
  createIndex = (collectionName, rules, options={}) => {
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
  aggregate = (collectionName, args) => {
    return this.connect()
    .then(db => {
      const dataBase = db.db(this.mongoName)
      return new Promise((resolve, reject) => {
        dataBase.collection(collectionName).aggregate(args).toArray(function(err, res) {
          if(err) {
            reject(err)
          }else {
            resolve(err)
          }
        })
      })
    })
    .catch(err => {
      console.log('fail connect: ' + err)
    })
  }

  //判断是否为合法的id
  isValidId = (id) => {
    return ObjectID.isValid(id)
  }

  //id处理
  dealId = (id) => {
    return new ObjectID(id)
  }
}

module.exports = MongoDB

