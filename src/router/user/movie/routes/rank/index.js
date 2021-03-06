const Router = require('@koa/router')
const SpecDropList = require('./specDropList')
const { RankModel, dealErr, notFound, Params, responseDataDeal, avatarGet, MOVIE_STATUS } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    validator: [
			data => ObjectId.isValid(data)
		]
	})
	if(check) return

	const [ currPage, pageSize, _id, glance, author_rate, hot, rate_person, total_rate ] = Params.sanitizers(ctx.query, {
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
	},
	{
		name: 'glance',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'author_rate',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'hot',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'rate_person',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'total_rate',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	})

	const data = await RankModel.findOneAndUpdate({
		_id,
	}, {
		$inc: { glance: 1 }
	})
	.select({
		match: 1,
		updatedAt: 1,
	})
	.populate({
		path: 'match',
		select: {
			"info.classify": 1,
			"info.description": 1,
			"info.name": 1,
			"info.screen_time": 1,
			poster: 1,
			hot: 1,
			author_rate: 1,
			total_rate: 1,
			rate_person: 1,
			images: 1
		},
		options: {
			sort: {
				...(!!glance ? { glance: 1 } : {}),
				...(!!author_rate ? { author_rate: 1 } : {}),
				...(!!hot ? { hot: 1 } : {}),
				...(!!rate_person ? { rate_person: 1 } : {}),
				...(!!total_rate ? { total_rate: 1 } : {}),
			},
			skip: (currPage >= 0 && pageSize >= 0) ? pageSize * currPage : 0,
			limit: pageSize >= 0 ? pageSize : 0
		},
		populate: [
			{
				path: 'info.classify',
				select: {
					_id: 0,
					name: 1
				}
			}
		]
	})
	.exec()
	.then(notFound)
	.then(data => {
		const { match } = data 
		return {
			data: match.map(m => {
				const { poster, info: { classify, description, name, screen_time }, total_rate, rate_person, images, ...nextM } = m
				const rate = total_rate / rate_person
				return {
					...nextM,
					store: false,
					poster: avatarGet(poster) ,
					publish_time: screen_time,
					classify,
					name,
					description,
					like: false,
					rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
					images: images.map(item => avatarGet(item))
				}
			})
		}
	})
	.catch(dealErr(ctx))
  
	responseDataDeal({
		ctx,
		data
	})
})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router