const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { SpecialModel, responseDataDeal, dealErr, notFound, Params, verifyTokenToData } = require('@src/utils')

const router = new Router()

const SORT_MAP = {
  date: 'createdAt',
  hot: 'glance'
} 

router
.get('/', async (ctx) => {
  
  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  })

  const { name, sort, valid, _id } = ctx.query
  let matchFields = { $match: {} }
  let sortFields = { $sort: {} }
  let limitFields = { $limit: pageSize }
  let skipFields = { $skip: pageSize * currPage }
  let initAggregate = [
    skipFields,
    limitFields,
  ]
  if(ObjectId.isValid(_id)) matchFields.$match._id = ObjectId(_id)
  if(typeof name == 'string' && name.length) {
    matchFields.$match.name = {
      $regex: name,
      $options: 'gi'
    }
  }
  if(typeof valid === 'boolean' || valid === 'true' || valid === 'false') matchFields.$match.valid = valid === 'false' ? false : !!valid
  if(typeof sort == 'string' && sort.length) {
    sortFields.$sort = sort.split(',').reduce((acc, cur) => {
      const [ key, value ] = cur.split('_').map(item => item.trim())
      if(SORT_MAP[key] && !Number.isNaN(+value)) acc[SORT_MAP[key]] = +value > 0 ? 1 : -1
      return acc 
    }, {})
  }
  if(!!Object.keys(matchFields.$match).length) initAggregate.unshift(matchFields)
  if(!!Object.keys(sortFields.$sort).length) initAggregate.unshift(sortFields)

  const total = await SpecialModel.aggregate([
    ...(!!Object.keys(matchFields.$match).length ? [matchFields] : []),
    {
      $project: {
        _id: 1
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1
        }
      }
    }
  ])
  const data = await SpecialModel.aggregate([
    ...initAggregate.slice(0, 1),
    {
      $lookup: {
        from: 'images', 
        localField: 'poster', 
        foreignField: '_id', 
        as: 'poster'
      }
    },
    {
      $unwind: "$poster"
    },
    {
      $lookup: {
        from: 'movies', 
        let: { movies: "$movie" },
        pipeline: [
          {
            $match: {
              $expr: {
                "$in": [ "$_id", "$$movies" ]
              }
            }
          },
          {
            $lookup: {
              from: 'images',
              as: 'poster',
              foreignField: "_id",
              localField: "poster"
            }
          },
          {
            $unwind: "$poster"
          }
        ],
        as: 'movie',
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        poster: "$poster.src",
        movie: {
          $map: {
            input: "$movie",
            as: 'value',
            in: {
              name: "$$value.name",
              _id: "$$value._id",
              poster: "$$value.poster.src"
            }
          }
        },
        createdAt: 1,
        updatedAt: 1,
        glance: {
          $size: {
            $ifNull: [
              "$glance", []
            ]
          }
        },
        valid: 1
      }
    },
    ...initAggregate.slice(1)
  ])
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data: {
      data: {
        total: (total[0] || { total: 0 }).total,
        list: data
      }
    }
  })

})
.post('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: 'movie',
    validator: [
      data => Array.isArray(data) && data.length >= 3 && data.every(item => ObjectId.isValid(item))
    ]
  },
  {
    name: 'poster',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0
    ]
  })

  if(check) return 

  const [ movie, poster ] = Params.sanitizers(ctx.request.body, {
    name: 'movie',
    sanitizers: [
      data => data.map(item => ObjectId(item))
    ]
  }, {
    name: 'poster',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { description, name, valid } = ctx.request.body
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const objId = ObjectId(id)

  let initData = {
    movie,
    poster,
    valid: !!valid,
    name,
    origin: objId
  }
  if(typeof description === 'string' && description.length > 0) initData.description = description

  const model = new SpecialModel(initData)

  const data = await model.save()
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => {
        if(typeof data !== 'string' || !data.length) return false 
        const lists = data.split(',')
        return lists.every(item => ObjectId.isValid(item.trim()))
      }
    ]
  })

  if(check) return 

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        return data.split(',').map(item => ObjectId(item.trim()))
      }
    ]
  })
  
  const data = await SpecialModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        data: null
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})
.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })

  if(check) return 

  const { movie, poster, valid, description, name } = ctx.request.body

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let setFields = {}
  if(Array.isArray(movie) && movie.length > 3) setFields.movie = movie 
  if(ObjectId.isValid(poster)) setFields.poster = poster 
  if(typeof valid === 'boolean') setFields.valid = valid
  if(typeof name === 'string' && name.length > 0) setFields.name = name 
  if(typeof description === 'string' && description.length > 0) setFields.description = description 

  const data = await SpecialModel.findOneAndUpdate({
    _id
  }, {
    $set: setFields
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})


module.exports = router