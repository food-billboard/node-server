const Router = require('@koa/router')
const { UserModel, dealErr, Params, responseDataDeal, parseData, avatarGet } = require("@src/utils")
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
    glance: 1,
    updatedAt: 1,
    _id: 0
  })
  .populate({
    path: 'glance._id',
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
    select: {
      "info.classify": 1,
			"info.description": 1,
      "info.name": 1,
      "info.screen_time": 1,
			poster: 1,
			hot: 1,
      images: 1,
			// author_rate: 1,
      rate_person: 1,
      total_rate: 1
    },
    populate: {
      path: "info.classify",
      select: {
        _id: 0,
        name: 1
      }
    }
  })
  .exec()
  .then(parseData)
  .then(data => {
    const { glance, ...nextData } = data || { glance: [] }
    return {
      data: {
        ...nextData,
        glance: glance.map(g => {
          const { _id: { info: { description, name, classify, screen_time }, poster, images, rate_person, total_rate,  ...nextD } } = g
          const rate = total_rate / rate_person
          return {
            ...nextD,
            poster: poster ? poster.src : null,
            description,
            name,
            classify,
            store:false,
            publish_time: screen_time,
            rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
            images: images.map(item => avatarGet(item))
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))
  
  responseDataDeal({
    ctx,
    data,
  })

})

module.exports = router