const Router = require('@koa/router')
const { UserModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })

  const data = await UserModel.findOne({
    _id
  })
  .select({
    fans: 1,
    updatedAt: 1,
    _id: 0
  })
  .populate({
    path: 'fans._id',
    select: {
      username: 1,
      avatar: 1,
      description: 1
    },
    options: { 
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { fans, ...nextData } = data
    return {
      data: {
        ...nextData,
        fans: fans.map(d => {
          const { _id: { avatar, ...nextD } } = d
          return {
            ...nextD,
            avatar: avatar ? avatar.src : null,
          }
        })
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