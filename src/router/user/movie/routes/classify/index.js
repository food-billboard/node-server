const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')
const { ClassifyModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
	})
	if(check) return

	const { sort={} } = ctx.query
	const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
		name: 'currPage',
		_default: 0,
		type: [ 'toInt' ],
		sanitizers: [
      data => data >= 0 ? data : -1
    ]
	}, {
		name: 'pageSize',
		_default: 30,
		type: [ 'toInt' ],
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

	const data = await ClassifyModel.findOneAndUpdate({
		_id
	}, {
		$inc: { glance: 1 }
	})
	.select({
		match: 1,
		_id: 0
	})
	.populate({
		path: 'match',
		select: {
			poster: 1,
			name: 1,
			"info.classify": 1,
			publish_time: 1,
			hot: 1,
			author_rate: 1,
		},
		options: {
			...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {}),
			sort
		},
		populate: {
			path: 'info.classify',
			select: {
				name: 1,
				_id: 0
			}
		}
	})
	.exec()
	.then(data => !!data && data._doc)
	.then(notFound)
	.then(data => {
		const { match } = data
		return {
			match: match.map(m => {
				const { _doc: { poster: { src }, ...nextM } } = m
				return {
					...nextM,
					poster: src,
				}
			})
		}
	})
	.catch(dealErr(ctx))

	responseDataDeal({
		ctx,
		data,
		needCache: false
	})

})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router