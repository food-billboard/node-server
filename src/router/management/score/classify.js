const Router = require('@koa/router')
const {
  verifyTokenToData,
  dealErr,
  Params,
  responseDataDeal,
  ScoreClassifyModel,
  ScorePrimaryClassifyModel,
  ScoreClassifyDesignModel,
  SCORE_TASK_REPEAT_TYPE
} = require('@src/utils')
const dayjs = require('dayjs')
const { isNil } = require('lodash')
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
  }, {
    name: 'max_age',
    sanitizers: [
      data => Number.isNaN(+data)
    ]
  }, {
    name: 'min_age',
    sanitizers: [
      data => Number.isNaN(+data)
    ]
  })
  if (check) return

  const { description, content,  } = ctx.request.body

  const [ primary, image, max_age, min_age ] = Params.sanitizers(ctx.request.body, {
    name: 'primary',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'image',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'max_age',
    sanitizers: [
      data => Math.abs(parseInt(data))
    ]
  }, {
    name: 'min_age',
    sanitizers: [
      data => Math.abs(parseInt(data))
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
        classify: primary,
        image,
        max_age,
        min_age
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

  const [_id, primary, image, max_age, min_age] = Params.sanitizers(ctx.request.body, {
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
  }, {
    name: 'max_age',
    sanitizers: [
      data => Math.abs(parseInt(data))
    ]
  }, {
    name: 'min_age',
    sanitizers: [
      data => Math.abs(parseInt(data))
    ]
  })

  const { description, content } = ctx.request.body

  //database
  let updateQuery = {
    description,
    content,
    classify: primary,
    image,
    max_age,
    min_age
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

  const [ start_date, end_date, primary_id, currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
  }, { 
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

  const { content } = ctx.query 

  let findQuery = {}
  if(start_date) {
    findQuery.createdAt = {
      $lte: end_date,
      $gte: start_date 
    }
  }
  if(primary_id) {
    findQuery.classify = primary_id
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
          as: 'classify',
          foreignField: "_id",
          localField: "classify"
        }
      },
      {
        $unwind: {
          path: "$classify",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          description: 1,
          content: 1,
          image: "$image.src",
          create_user: "$create_user._id",
          create_user_name: "$create_user.username",
          primary_content: "$classify.content",
          primary_id: "$classify._id",
          createdAt: 1,
          updatedAt: 1,
          max_age: 1,
          min_age: 1
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
.get('/design', async (ctx) => {

  const check = Params.query(ctx, {
    name: 'target_user',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if(check) return 

  const { content, classify, holiday, repeat_type, currPage, pageSize, target_user } = ctx.query 

  let findQuery = {
    target_user: ObjectId(target_user)
  }
  if(classify) {
    findQuery = {
      ...findQuery,
      classify: ObjectId(classify)
    }
  }
  if(typeof holiday === 'boolean') {
    findQuery = {
      ...findQuery,
      holiday
    }
  }
  if(repeat_type) {
    findQuery = {
      ...findQuery,
      repeat_type
    }
  }
  let contentQuery = []
  if(content) {
    contentQuery = [
      {
        $lookup: {
          from: 'score_classifies',
          as: 'classify',
          foreignField: "_id",
          localField: "classify"
        }
      },
      {
        $unwind: {
          path: "$classify",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $match: {
          $or: [
            {
              "classify.content": {
                $regex: content,
                $options: 'gi'
              }
            },
          ]
        }
      },
    ]
  }

  //database
  const data = await Promise.all([
    ScoreClassifyDesignModel.aggregate([
      {
        $match: findQuery
      },
      ...contentQuery,
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    ScoreClassifyDesignModel.aggregate([
      {
        $match: findQuery
      },
      ...contentQuery,
      {
        $skip: currPage * pageSize
      },
      {
        $limit: +pageSize
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
          from: 'score_classifies',
          as: 'classify',
          foreignField: "_id",
          localField: "classify"
        }
      },
      {
        $unwind: {
          path: "$classify",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          holiday: 1,
          repeat_type: 1,
          repeat: 1,
          max_age: 1,
          min_age: 1,
          create_user: "$create_user._id",
          create_user_name: "$create_user.username",
          classify_content: "$classify.content",
          classify_id: "$classify._id",
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
.post('/design', async(ctx) => {
   //validate params
   const check = Params.body(ctx, {
    name: 'repeat_type',
    validator: [
      data => !!SCORE_TASK_REPEAT_TYPE[data]
    ]
  }, {
    name: 'classify',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'target_user',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'repeat',
    validator: [
      data => Array.isArray(data)
    ]
  }, {
    name: 'max_age',
    sanitizers: [
      data => Math.abs(parseInt(data))
    ]
  }, {
    name: 'min_age',
    sanitizers: [
      data => Math.abs(parseInt(data))
    ]
  })
  if (check) return

  const { holiday, target_user, classify, repeat_type, repeat, max_age, min_age } = ctx.request.body

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await ScoreClassifyDesignModel.findOneAndUpdate({
    target_user: ObjectId(target_user),
    classify: ObjectId(classify)
  }, {
    $set: {
      holiday, 
      repeat_type, 
      repeat, 
      max_age: Math.abs(parseInt(max_age)), 
      min_age: Math.abs(parseInt(min_age))
    }
  })
    .exec()
    .then(data => !!data)
    .then((data) => {
      if(data) return data 
      //database
      const model = new ScoreClassifyDesignModel({
        holiday, 
        target_user, 
        create_user: ObjectId(id),
        classify, 
        repeat_type, 
        repeat, 
        max_age: Math.abs(parseInt(max_age)), 
        min_age: Math.abs(parseInt(min_age))
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


module.exports = router