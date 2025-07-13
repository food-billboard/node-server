const Router = require('@koa/router')
const {
  verifyTokenToData,
  dealErr,
  Params,
  responseDataDeal,
  ScoreClassifyModel,
  ScorePrimaryClassifyModel
} = require('@src/utils')
const dayjs = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.post('/', async (ctx) => {
  //validate params
  const check = Params.body(ctx, {
    name: 'content',
    validator: [
      data => !!data
    ]
  }, {
    name: 'primary',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'image',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if (check) return

  const { description, content,  } = ctx.request.body

  const [ primary, image ] = Params.sanitizers(body, {
    name: 'primary',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'image',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await ScoreClassifyModel.findOne({
    content,
  })
    .exec()
    .then(data => !!data)
    .then((data) => {
      if(data) return Promise.reject({errMsg: '标题重复', status: 400})
      //database
      const model = new ScoreClassifyModel({
        content,
        description,
        create_user: ObjectId(id),
        primary,
        image
      })
      return model.save()
    })
    .then(data => {
      return {
        data: data._id
      }
    })
    .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})
.put('/', async (ctx) => {
  //validate params
  const check = Params.body(ctx, {
    name: 'content',
    validator: [
      data => !!data
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'primary',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'image',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  if (check) return

  const [_id, primary, image] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      function (data) {
        return ObjectId(data)
      }
    ]
  }, {
    name: 'primary',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'image',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { description, content } = ctx.request.body

  //database
  let updateQuery = {
    description,
    content,
    primary,
    image
  }
  const data = await ScoreClassifyModel.findOne({
    content,
    _id: {
      $nin: [_id]
    }
  })
    .exec()
    .then((data) => {
      if(data) return Promise.reject({errMsg: '标题重复', status: 400})
      return ScoreClassifyModel.updateOne({
        _id
      }, {
        $set: updateQuery
      })
    })
    .then(data => {
      if (data.nModified === 0) return Promise.reject({ status: 404, errMsg: 'not Found' })
      return {
        data: data._id
      }
    })
    .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})
.delete('/', async (ctx) => {
  //validate params
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(data => ObjectId.isValid(data))
    ]
  })
  if (check) return

  const [_id] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      function (data) {
        return data.split(',').map(data => ObjectId(data))
      }
    ]
  })

  //database
  const data = await ScoreClassifyModel.deleteMany({
    _id: {
      $in: _id
    }
  })
    .then(data => {
      if (data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
      return {
        data: null
      }
    })
    .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})
.get('/', async (ctx) => {

  const [ start_date, end_date, primary_id ] = Params.sanitizers(ctx.query, {
    name: 'start_date',
    sanitizers: [
      function(data) {
        try {
          if(!data) return null 
          const date = dayjs(data)
          return date.isValid() ? date.toDate() : null 
        }catch(err) {
          return null 
        }
      }
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      function(data) {
        try {
          if(!data) return null 
          const date = dayjs(data)
          return date.isValid() ? date.toDate() : null 
        }catch(err) {
          return null 
        }
      }
    ]
  }, {
    name: 'primary_id',
    sanitizers: [
      function (data) {
        try {
          if(!data) return null 
          return ObjectId(data)
        }catch(err) {
          return null 
        }
      }
    ]
  })
  const { content, currPage, pageSize } = ctx.query 

  let findQuery = {}
  if(start_date) {
    findQuery.createdAt = {
      $lte: end_date,
      $gte: start_date 
    }
  }
  if(primary_id) {
    findQuery.primary = primary_id
  }
  if(content) {
    findQuery = {
      ...findQuery,
      $or: [
        {
          content: {
            $regex: content,
            $options: 'gi'
          }
        },
        {
          description: {
            $regex: content,
            $options: 'gi'
          }
        },
      ]
    }
  }

  //database
  const data = await Promise.all([
    ScoreClassifyModel.aggregate([
      {
        $match: findQuery
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
    ScoreClassifyModel.aggregate([
      {
        $match: findQuery
      },
      {
        $skip: currPage * pageSize
      },
      {
        $limit: +pageSize
      },
      {
        $lookup: {
          from: 'images',
          as: 'image',
          foreignField: "_id",
          localField: "image"
        }
      },
      {
        $unwind: {
          path: "$image",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'users',
          as: 'create_user',
          foreignField: "_id",
          localField: "create_user"
        }
      },
      {
        $unwind: {
          path: "$create_user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'score_primary_classifies',
          as: 'primary',
          foreignField: "_id",
          localField: "primary"
        }
      },
      {
        $unwind: {
          path: "$primary",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          description: 1,
          content: 1,
          image: "$image",
          create_user: "$create_user._id",
          create_user_name: "$create_user.username",
          primary_content: "$primary.content",
          primary_id: "$primary._id",
          createdAt: 1,
          updatedAt: 1,
        }
      }
    ])
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
    data
  })

})
.get('/primary', async (ctx) => {

  const { content } = ctx.query 

  let findQuery = {}
  if(content) {
    findQuery = {
      ...findQuery,
      $or: [
        {
          content: {
            $regex: content,
            $options: 'gi'
          }
        },
      ]
    }
  }

  //database
  const data = await ScorePrimaryClassifyModel.aggregate([
    {
      $match: findQuery
    },
    {
      $limit: 999
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    }
  ])
  .then((data) => {
    return {
      data: {
        list: data,
        total: data.length,
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})


module.exports = router