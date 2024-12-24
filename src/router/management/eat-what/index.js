const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const { 
  dealErr, 
  Params, 
  responseDataDeal, 
  EAT_WHAT_MENU_TYPE,
  EatWhatClassifyModel
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
    if(check) return
  
    const [ menu_type ] = Params.sanitizers(ctx.request.body, {
      name: 'menu_type',
      sanitizers: [
        function(data) {
          return EAT_WHAT_MENU_TYPE[data] || EAT_WHAT_MENU_TYPE.BREAKFAST
        }
      ]
    })

    const { title, description, content } = ctx.request.body 
  
    //database
    const model = new EatWhatClassifyModel({
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
    if(check) return
  
    const [ menu_type, _id ] = Params.sanitizers(ctx.request.body, {
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
      menu_type,
      title,
      description,
      content
    }
    const data = await EatWhatClassifyModel.updateOne({
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
.delete('/classify', async (ctx) => {
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
    const data = await EatWhatClassifyModel.deleteMany({
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

module.exports = router
