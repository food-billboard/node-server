const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const dayjs = require('dayjs')
const { 
  dealErr, 
  Params, 
  responseDataDeal, 
  notFound,
  EAT_WHAT_MENU_TYPE,
  EatWhatModel,
  EatWhatClassifyModel
} = require("@src/utils")

const router = new Router()

router
.get('/', async (ctx) => {

  const [ date, menu_type ] = Params.sanitizers(ctx.query, {
    name: 'date',
    sanitizers: [
      function(data) {
        const [start, end] = (data || '').split(',').map(item => item.trim())
        try {
          return [dayjs(start).toDate(), dayjs(end).toDate()]
        }catch(err) {
          return [dayjs().toDate(), dayjs().toDate()]
        }
      }
    ]
  }, {
    name: 'menu_type',
    sanitizers: [
      function(data) {
        return EAT_WHAT_MENU_TYPE[data] || ''
      }
    ]
  })
  const { content, currPage, pageSize } = ctx.query 

  let findQuery = {
    date: {
      $lte: date[1],
      $gte: date[0]
    }
  }
  // ? 这个查询有点难度，暂时不搞了
  if(content && false) {
    findQuery = {
      ...findQuery,
      $or: [
        {
          title: {
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
        {
          content: {
            $regex: content,
            $options: 'gi'
          }
        }
      ]
    }
  }
  if(menu_type) {
    findQuery.menu_type = menu_type
  }

  //database
  const data = await Promise.all([
    EatWhatModel.aggregate([
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
    EatWhatModel.aggregate([
      {
        $match: findQuery
      },
      ...(typeof currPage !== 'undefined' ? [
        {
          $skip: currPage * pageSize
        },
        {
          $limit: +pageSize
        },
      ] : []),
      {
        $lookup: {
          from: 'eat_what_classifies',
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
          content: "$classify.content",
          classify_description: "$classify.description",
          title: "$classify.title",
          menu_type: 1,
          classify: "$classify._id",
          date: 1,
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
.post('/', async (ctx) => {
    //validate params
    const check = Params.body(ctx, {
      name: 'classify',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })
    if(check) return
  
    const [ date, classify, menu_type ] = Params.sanitizers(ctx.request.body, {
      name: 'date',
      sanitizers: [
        function(data) {
          return dayjs(data).isValid() ? dayjs(data).toDate() : dayjs().toDate()
        }
      ]
    }, {
      name: 'classify',
      sanitizers: [
        function(data) {
          return ObjectId(data)
        }
      ]
    }, {
      name: 'menu_type',
      sanitizers: [
        function(data) {
          return EAT_WHAT_MENU_TYPE[data] || EAT_WHAT_MENU_TYPE.BREAKFAST
        }
      ]
    })

    const { description } = ctx.request.body 
  
    //database
    const model = new EatWhatModel({
      date,
      description,
      classify,
      menu_type
    })
    const data = await model.save()
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
      name: 'classify',
      validator: [
        data => ObjectId.isValid(data)
      ]
    }, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data) 
      ]
    })
    if(check) return
  
    const [ date, classify, _id, menu_type ] = Params.sanitizers(ctx.request.body, {
      name: 'date',
      sanitizers: [
        function(data) {
          return dayjs(data).isValid() ? dayjs(data).toDate() : dayjs().toDate()
        }
      ]
    }, {
      name: 'classify',
      sanitizers: [
        function(data) {
          return ObjectId(data)
        }
      ]
    }, {
      name: '_id',
      sanitizers: [
        function(data) {
          return ObjectId(data)
        }
      ]
    }, {
      name: 'menu_type',
      sanitizers: [
        function(data) {
          return EAT_WHAT_MENU_TYPE[data] || EAT_WHAT_MENU_TYPE.BREAKFAST
        }
      ]
    })

    const { description } = ctx.request.body 
  
    //database
    let updateQuery = {
      date,
      description,
      classify,
      menu_type
    }
    const data = await EatWhatModel.updateOne({
      _id
    }, {
      $set: updateQuery
    })
    .then(data => {
      if(data.nModified === 0) return Promise.reject({ status: 404, errMsg: 'not Found' })
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
    if(check) return
  
    const [ _id ] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        function(data) {
          return data.split(',').map(data => ObjectId(data))
        }
      ]
    })
  
    //database
    const data = await EatWhatModel.deleteMany({
      _id: {
        $in: _id
      }
    })
    .then(data => {
      if(data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
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
.get('/detail', async (ctx) => {
    //validate params
    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })
    if(check) return
  
    const [ _id ] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        function(data) {
          return ObjectId(data)
        }
      ]
    })
  
    //database
    const data = await EatWhatModel.findOne({
      _id
    })
    .select({
      _id: 1,
      menu_type: 1,
      date: 1,
      createdAt: 1,
      updatedAt: 1,
      classify: 1,
      description: 1,
    })
    .exec()
    .then(notFound)
    .then(data => {
      return {
        data: {
          ...data.classify,
          ...data,
          classify: data.classify._id,
          classify_description: data.classify.description
        }
      }
    })
    .catch(dealErr(ctx))
  
    responseDataDeal({
      ctx,
      data
    })
})
.get('/classify', async (ctx) => {

  const [ menu_type ] = Params.sanitizers(ctx.query, {
    name: 'menu_type',
    sanitizers: [
      function(data) {
        return EAT_WHAT_MENU_TYPE[data] || ''
      }
    ]
  })
  const { content, currPage, pageSize } = ctx.query 

  let findQuery = {}
  if(content) {
    findQuery = {
      ...findQuery,
      $or: [
        {
          title: {
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
        {
          content: {
            $regex: content,
            $options: 'gi'
          }
        }
      ]
    }
  }
  if(menu_type) {
    findQuery.menu_type = menu_type
  }

  //database
  const data = await Promise.all([
    EatWhatClassifyModel.aggregate([
      {
        $match: findQuery
      },
      ...(typeof currPage !== 'undefined' ? [
        {
          $skip: currPage * pageSize
        },
        {
          $limit: +pageSize
        },
      ] : []),
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    EatWhatClassifyModel.aggregate([
      {
        $match: findQuery
      },
      ...(typeof currPage !== 'undefined' ? [
        {
          $skip: currPage * pageSize
        },
        {
          $limit: +pageSize
        },
      ] : []),
      {
        $project: {
          _id: 1,
          content: 1,
          description: 1,
          title: 1,
          menu_type: 1,
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
.get('/classify/detail', async (ctx) => {
  //validate params
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })

  //database
  const data = await EatWhatClassifyModel.findOne({
    _id
  })
  .select({
    _id: 1,
    content: 1,
    description: 1,
    title: 1,
    menu_type: 1,
    date: 1,
    createdAt: 1,
    updatedAt: 1,
  })
  .exec()
  .then(notFound)
  .then(data => {
    return {
      data
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})

module.exports = router
