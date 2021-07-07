const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, dealErr, Params, responseDataDeal, parseData, MemberModel, notFound, RoomModel } = require('@src/utils')
const Message = require('./message')
const Room = require('./room')
const Member = require('./member')

const router = new Router()

router
.post('/connect', async(ctx) => {

  const [, token] = verifyTokenToData(ctx)

  const check = Params.body(ctx, {
    name: 'sid',
    validator: [
      data => !!data 
    ]
  })
  if(check) return 

  const { sid, temp_user_id } = ctx.request.body

  let query = {}
  let setting = {}
  if(token) {
    query = {
      user: ObjectId(token.id)
    }
    setting = {
      $set: {
        sid,
        temp_user_id: ''
      }
    }
  }else {
    query = {
      $or: [
        {
          sid 
        },
        {
          temp_user_id
        }
      ]
    }
    setting = {
      $set: {
        sid,
        temp_user_id
      }
    }
  }

  const data = await MemberModel.findOneAndUpdate(query, setting, {
    upsert: true,
    new: true
  })
  .select({
    _id: 1
  })
  .exec()
  .then(parseData)
  .then(data => {
    return {
      data: {
        user: data._id,
        temp_user_id
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    ctx,
    needCache: false 
  })

})
.post('/disconnect', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)

  const check = Params.body(ctx, {
    name: 'sid',
    validator: [
      data => !!data 
    ]
  })
  if(check) return 

  const { sid } = ctx.request.body

  let query = {}
  let setting = {}
  if(token) {
    query = {
      user: ObjectId(token.id)
    }
    setting = {
      $set: {
        sid: '',
        temp_user_id: '',
      }
    }
  }else {
    query = {
      sid
    }
    setting = {
      $set: {
        sid: '',
      }
    }
  }

  const data = await MemberModel.findOneAndUpdate(query, setting)
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data 
    return RoomModel.updateMany({
      members: {
        $in: [_id] 
      },
      online_members: {
        $in: [_id] 
      }
    }, {
      $pull: {
        online_members: _id 
      }
    })
  })
  .then(_ => ({ data: {} }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    ctx,
    needCache: false 
  })
})
.use('/message', Message.routes(), Message.allowedMethods())
.use('/room', Room.routes(), Room.allowedMethods())
.use('/member', Member.routes(), Member.allowedMethods())

module.exports = router