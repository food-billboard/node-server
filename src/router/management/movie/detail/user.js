const Router = require('@koa/router')
const { UserModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//电影访问用户列表(分页 时间 用户状态)
.get('/', async(ctx) => {

    const check = Params.query(ctx, {
        name: '_id',
        type: [ 'isMongoId' ]
    }, {
        name: 'start_date',
        validator: [
            data => typeof data === 'string' ? (new Date(data)).toString() !== 'Invalid Date' : typeof data === 'undefined'
        ]
    }, {
        name: 'end_date',
        validator: [
            data => typeof data === 'string' ? (new Date(data)).toString() !== 'Invalid Date' : typeof data === 'undefined'
        ]
    })

    if(check) return

    const [ _id, currPage, pageSize ] = Params.sanitizers(ctx.query, {
        name: '_id',
        sanitizers: [
          data => ObjectId(data)
        ]
    }, {
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
      })

    const data = await UserModel.aggregate([

    ])
    .exec()
    .then(data => !!data && data)
    .then(notFound)
    .then(data => {

    })
    .catch(dealErr(ctx))

    responseDataDeal({
        ctx,
        data,
        needCache: false
    })

})

module.exports = router