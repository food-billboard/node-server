const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { currPage=0, pageSize=30 } = ctx.query
  const { mobile } = token
  let res

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    attentions: 1
  })
  .populate({
    path: 'attentions',
    select: {
      username: 1,
      avatar: 1
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { attentions } = data
    return {
      attentions: attentions.map(a => {
        const { _doc: { avatar: { src }, ...nextA } } = a
        return {
          ...nextA,
          avatar: src,
        }
      })
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.put('/', async (ctx) => {
  Params.body(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  
  const [, token] = verifyTokenToData(ctx)
  const { body: { _id } } = ctx.request
  const { mobile } = token
  let res

  const data = await UserModel.findOneAndUpdate({
    mobile: Number(mobile)
  }, {
    $push: { attentions: ObjectId(_id) }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    return UserModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $push: { fans: id }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }
  ctx.body = JSON.stringify(res)
})
.delete('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { _id  } = ctx.query
  const { mobile } = token
  let res
  const data = await UserModel.findOneAndUpdate({
    mobile: Number(mobile)
  }, {
    $pull: { attentions: ObjectId(_id) }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    return UserModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $pull: { fans: id }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: false,
      res: null
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router