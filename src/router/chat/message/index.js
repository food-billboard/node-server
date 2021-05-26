const Router = require('@koa/router')
const { verifyTokenToData, MessageModel, dealErr, Params, responseDataDeal } = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {

})
.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item))
		]
  })
  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Param.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  })

  const data = await new Promise((resolve, reject) => {
    if(token) {
      resolve()
    }else {
      reject({
        errMsg: 'not authorization',
        status: 401
      })
    }
  })
  .then(_ => {
    const { id } = token
    return MessageModel.updateMany({
      _id: {
        $in: _id
      },
    }, {
      $addToSet: {
        readed: ObjectId(id)
      }
    })
  })
  .then(_ => ({ data: _id }))
  // await RoomModel.updateOne({
  //   _id
  // }, {
  //   $set: { "members.$[message].message.$[user].readed": true }
  // }, {
  //   arrayFilters: [
  //     {
  //       message: {
  //         $type: 3
  //       },
  //       "message.user": ObjectId(id)
  //     },
  //     {
  //       user: {
  //         $type: 3
  //       },
  //       "user.readed": false
  //     }
  //   ]
  // })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.delete('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item))
		]
  })
  if(check) return 

  const { id } = token
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  })

  const data = await new Promise((resolve, reject) => {
    if(token) {
      resolve()
    }else {
      reject({
        errMsg: 'not authorization',
        status: 401
      })
    }
  })
  .then(_ => {
    return MessageModel.updateMany({
      _id: {
        $in: _id
      },
    }, {
      $pull: { un_deleted: ObjectId(id) }
    })
  })
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })
  
})

module.exports = router