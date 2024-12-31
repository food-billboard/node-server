const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const {
  dealErr,
  Params,
  responseDataDeal,
  EAT_WHAT_MENU_TYPE,
  EAT_WHAT_FOOD_TYPE,
  EatWhatClassifyModel,
  notFound
} = require("@src/utils")

const router = new Router()

router
  .post('/classify', async (ctx) => {
    //validate params
    const check = Params.body(ctx, {
      name: 'title',
      validator: [
        data => !!data
      ]
    })
    if (check) return

    const [menu_type, food_type] = Params.sanitizers(ctx.request.body, {
      name: 'menu_type',
      sanitizers: [
        function (data) {
          return data.split(',').map(item => EAT_WHAT_MENU_TYPE[item.trim()] || EAT_WHAT_MENU_TYPE.BREAKFAST)
        }
      ]
    }, {
      name: 'food_type',
      sanitizers: [
        function (data) {
          return EAT_WHAT_FOOD_TYPE[data.trim()] || EAT_WHAT_FOOD_TYPE.OTHER
        }
      ]
    })

    const { title, description, content } = ctx.request.body

    const data = await EatWhatClassifyModel.findOne({
      title,
    })
      .exec()
      .then(data => !!data)
      .then((data) => {
        if(data) return Promise.reject({errMsg: '标题重复', status: 400})
        //database
        const model = new EatWhatClassifyModel({
          menu_type,
          title,
          description,
          content,
          food_type
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
  .put('/classify', async (ctx) => {
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
    if (check) return

    const [menu_type, _id, food_type] = Params.sanitizers(ctx.request.body, {
      name: 'menu_type',
      sanitizers: [
        function (data) {
          return data.split(',').map(item => EAT_WHAT_MENU_TYPE[item.trim()] || EAT_WHAT_MENU_TYPE.BREAKFAST)
        }
      ]
    }, {
      name: '_id',
      sanitizers: [
        function (data) {
          return ObjectId(data)
        }
      ]
    }, {
      name: 'food_type',
      sanitizers: [
        function (data) {
          return EAT_WHAT_FOOD_TYPE[data.trim()] || EAT_WHAT_FOOD_TYPE.OTHER
        }
      ]
    })

    const { title, description, content } = ctx.request.body

    //database
    let updateQuery = {
      menu_type,
      title,
      description,
      content,
      food_type: [food_type]
    }
    const data = await EatWhatClassifyModel.findOne({
      title,
      $not: {
        _id
      }
    })
      .exec()
      .then((data) => {
        if(data) return Promise.reject({errMsg: '标题重复', status: 400})
        return EatWhatClassifyModel.updateOne({
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
  .delete('/classify', async (ctx) => {
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
    const data = await EatWhatClassifyModel.deleteMany({
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

module.exports = router
