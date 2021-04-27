const Router = require('@koa/router')
const { TagModel, dealErr, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

const router = new Router()

router
.get('/', async(ctx) => {

  const { currPage, pageSize, ...nextParams } = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        if(data.split(',').every(item => ObjectId.isValid(item.trim()))) return {
          done: true,
          data: {
            _id: { $in: data.split(',').map(item => ObjectId(item.trim())) }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'content',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) {

          function reg(content) {
            return {
              $regex: content,
              $options: 'gi'
            }
          }

          let filter = [
            {
              text: reg(data)
            },
          ]
          if(ObjectId.isValid(data)) filter.push({
            origin: ObjectId(data)
          })

          return {
            done: true,
            data: {
              $or: filter
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'valid',
    sanitizers: [
      data => {
        if(typeof data === 'boolean') return {
          done: true,
          data: {
            valid: !!data
          }
        }
        if(typeof data === 'string' && (data === 'true' || data === 'false')) return {
          done: true,
          data: {
            valid: data === 'true'
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'weight',
    sanitizers: [
      data => {
        const _data = parseInt(data)
        if(typeof _data === 'number' && !Number.isNaN(_data) && _data >= 0) return {
          done: true,
          data: {
            auth: _data
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => ({
        done: true,
        data: data >= 0 ? +data : 0
      })
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => ({
        done: true,
        data: data >= 0 ? +data : 30
      })
    ]
  }, true)

  let query = Object.values(nextParams).reduce((acc, cur) => {
    acc = {
      ...acc,
      ...cur,
    }
    return acc 
  }, {})
  const { start_date, end_date } = ctx.query
  if(typeof start_date === 'string' && Day(start_date).isValid()) {
    query.createdAt = {
      ...query.createdAt || {},
      $gte: Day(start_date).toDate()
    }
  }
  if(typeof end_date === 'string' && Day(end_date).isValid()) {
    query.createdAt = {
      ...query.createdAt || {},
      $lte: Day(end_date).toDate()
    }
  }

  const aggregate = [
    {
      $match: query
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'movies',
        localField: 'source',
        foreignField: '_id',
        as: 'source'
      }
    },
    {
      $unwind: "$source"
    },
    {
      $project: {
        _id: 1,
        text: 1,
        weight: 1,
        createdAt: 1,
        updatedAt: 1,
        valid: 1,
        source: {
          _id: "$source._id",
          name: "$source.name"
        }
      }
    }
  ]

  const data = await Promise.all([
    TagModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    TagModel.aggregate(aggregate)
  ])
  .then(([total, data]) => {
    return {
      data: {
        list: data,
        total: !!total.length ? total[0].total || 0 : 0,
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data
  })

})
.put('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: 'valid',
    validator: [
      data => typeof data === 'boolean'
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ _id, valid ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'valid',
    sanitizers: [
      data => !!data
    ]
  })

  const data = TagModel.updateOne({
    _id
  }, {
    $set: { valid }
  })
  .then(res => {
    if(res.nModified != 1) {
      return Promise.reject({ errMsg: 'not found', status: 400 })
    }
    return true
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item.trim()))
    ]
  })

  if(check) return 

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = TagModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(res => {
    if(res.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 400 })
    return true
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router