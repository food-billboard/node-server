const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//电影评论列表 时间 分页 排序（hot 时间）
.get('/', async(ctx) => {

    const check = Params.query(ctx, {
        name: '_id',
        type: [ 'isMongoId' ]
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
          data => ObjectId(data)
        ]
    })

    const data = await MovieModel.findOne({
        _id
    })
    .select({

    })
    .exec()
    .then(data => !!data && data._doc)
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