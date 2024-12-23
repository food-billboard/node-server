const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const dayjs = require('dayjs')
const { 
  dealErr, 
  Params, 
  responseDataDeal, 
  notFound,
  EAT_WHAT_MENU_TYPE,
  EatWhatModel
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
        $project: {
          _id: 1,
          content: 1,
          description: 1,
          title: 1,
          menu_type: 1,
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
      name: 'title',
      validator: [
        data => !!data
      ]
    })
    if(check) return
  
    const [ date, menu_type ] = Params.sanitizers(ctx.request.body, {
      name: 'date',
      sanitizers: [
        function(data) {
          return dayjs(data).isValid() ? dayjs(data).toDate() : dayjs().toDate()
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

    const { title, description, content } = ctx.request.body 
  
    //database
    const model = new EatWhatModel({
      date,
      menu_type,
      title,
      description,
      content
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
      name: 'title',
      validator: [
        data => !!data
      ]
    }, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data) 
      ]
    })
    if(check) return
  
    const [ date, menu_type, _id ] = Params.sanitizers(ctx.request.body, {
      name: 'date',
      sanitizers: [
        function(data) {
          return dayjs(data).isValid() ? dayjs(data).toDate() : dayjs().toDate()
        }
      ]
    }, {
      name: 'menu_type',
      sanitizers: [
        function(data) {
          return EAT_WHAT_MENU_TYPE[data] || EAT_WHAT_MENU_TYPE.BREAKFAST
        }
      ]
    }, {
      name: '_id',
      sanitizers: [
        function(data) {
          return ObjectId(data)
        }
      ]
    })

    const { title, description, content } = ctx.request.body 
  
    //database
    let updateQuery = {
      date,
      menu_type,
      title,
      description,
      content
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
