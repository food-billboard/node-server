const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const dayjs = require('dayjs')
const { 
  dealErr, 
  Params, 
  responseDataDeal, 
  notFound,
  EAT_WHAT_MENU_TYPE,
  EAT_WHAT_FOOD_TYPE,
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
      name: 'value_list',
      validator: [
        (data) => {
          return data.every(item => ObjectId.isValid(item.classify))
        }
      ]
    })
    if(check) return
  
    const [ value_list ] = Params.sanitizers(ctx.request.body, {
      name: 'value_list',
      sanitizers: [
        function(data) {
          return data.map(item => {
            const { date, classify, menu_type, _id, ...nextItem } = item
            return {
              ...nextItem,
              date: dayjs(date).isValid() ? dayjs(date).toDate() : dayjs().toDate(),
              classify: ObjectId(classify),
              menu_type: EAT_WHAT_MENU_TYPE[menu_type] || EAT_WHAT_MENU_TYPE.BREAKFAST
            } 
          })
        }
      ]
    })

    const data = await EatWhatModel.create(value_list)
    .then(data => {
      return {
        data: data.map(item => item._id)
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

  const [ menu_type, food_type ] = Params.sanitizers(ctx.query, {
    name: 'menu_type',
    sanitizers: [
      function(data) {
        return EAT_WHAT_MENU_TYPE[data] || ''
      }
    ]
  }, {
    name: 'food_type',
    sanitizers: [
      function(data) {
        return EAT_WHAT_FOOD_TYPE[data] || ''
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
  if(food_type) {
    findQuery.food_type = food_type
  }

  //database
  const data = await Promise.all([
    EatWhatClassifyModel.aggregate([
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
          food_type: 1,
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
.get('/random', async (ctx) => {
  //validate params
  const check = Params.query(ctx, {
    name: 'breakfast',
    validator: [
      data => !Number.isNaN(data)
    ]
  }, {
    name: 'lunch',
    validator: [
      data => data.split(',').every(item => !Number.isNaN(item.trim()))
    ]
  }, {
    name: 'dinner',
    validator: [
      data => data.split(',').every(item => !Number.isNaN(item.trim()))
    ]
  }, {
    name: 'night_snack',
    validator: [
      data => !Number.isNaN(data)
    ]
  })
  if(check) return

  const { breakfast, lunch, dinner, night_snack, ignore='' } = ctx.query
  const [ lunchMeat, lunchVegetable ] = lunch.split(',').map(item => +item.trim())
  const [ dinnerMeat, dinnerVegetable ] = dinner.split(',').map(item => +item.trim())

  const ignoreIds = ignore.split(',').filter(item => !!item.trim()).map(item => ObjectId(item.trim()))

  function task(menu_type, count, food_type) {
    if(!count) return []
    const query = {
      menu_type: {
        $in: [menu_type]
      },
      _id: {
        $nin: ignoreIds
      },
    }
    if(food_type) {
      query.food_type = {
        $in: [food_type]
      }
    }
    return EatWhatClassifyModel.aggregate([
      {
        $match: query
      },
      { 
        $sample: { 
          size: count 
        } 
      },
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
    .then(data => {
      return {
        value: data,
        field: menu_type.toLowerCase()
      }
    })
  }

  //database
  const data = await Promise.all([
    {
      count: +lunchMeat,
      field: 'lunch',
      food_type: 'MEAT'
    },
    {
      count: +lunchVegetable,
      field: 'lunch',
      food_type: 'VEGETABLE'
    },
    {
      count: +dinnerMeat,
      field: 'dinner',
      food_type: 'MEAT'
    },
    {
      count: +dinnerVegetable,
      field: 'dinner',
      food_type: 'VEGETABLE'
    },
    {
      count: +breakfast,
      field: 'breakfast'
    },
    {
      count: +night_snack,
      field: 'night_snack'
    }
  ].map(item => {
    return task(item.field.toUpperCase(), item.count, item.food_type)
  }))
  .then(([lunchMeat, lunchVegetable, dinnerMeat, dinnerVegetable, ...nextData]) => {
    return {
      data: {
        lunch: [
          ...lunchMeat.value,
          ...lunchVegetable.value 
        ], 
        dinner: [
          ...dinnerMeat.value,
          ...dinnerVegetable.value 
        ], 
        ...nextData.reduce((acc, cur) => {
          const { value, field } = cur
          acc[field] = value  
          return acc 
        }, {})
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
