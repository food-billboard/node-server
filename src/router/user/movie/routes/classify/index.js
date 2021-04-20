const Router = require('@koa/router')
const { pick, merge } = require('lodash')
const SpecDropList = require('./sepcDropList')
const { ClassifyModel, MovieModel, dealErr, notFound, Params, responseDataDeal, avatarGet } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {

	const check = Params.query(ctx, {
    name: "_id",
		validator: [
			data => ObjectId.isValid(data)
		]
	})
	if(check) return

	//参数处理
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

	const data = await Promise.all([
		ClassifyModel.findOneAndUpdate({
			_id
		}, {
			$inc: { glance: 1 }
		}),
		MovieModel.find({
			"info.classify": { $in: [ _id ] }
		})
		.select({
			poster: 1,
			name: 1,
			"info.classify": 1,
			"info.screen_time": 1,
			hot: 1,
			author: 1,
			author_rate: 1,
			author_description: 1
		})
		.skip((currPage >= 0 && pageSize >= 0) ? pageSize * currPage : 0)
		.limit(pageSize >= 0 ? pageSize: 10)
		.populate({
			path: 'info.classify',
			select: {
				name: 1,
				_id: 0
			}
		})
		.populate({
			path: 'author',
			select: {
				username: 1,
				avatar: 1
			},
			populate: {
				path: 'avatar',
				select: {
					src: 1
				}
			}
		})
		.exec()
	])
	.then(([_, data]) => !!data && data)
	.then(notFound)
	.then(data => {
		return {
			data: data.map(item => {
				const { _doc: { poster, info: { screen_time, classify }, author, author_rate, ...nextM } } = item
				const { avatar, ...nextAuthor } = pick(author, ['username', '_id', 'avatar'])
				return {
					...nextM,
					rate: author_rate,
					author: merge({}, nextAuthor, { avatar: avatarGet(avatar) }),
					poster: avatarGet(poster),
					publish_time: screen_time,
					classify: classify.map(item => pick(item, ['name'])),
				}
			})
		}
	})
	.catch(dealErr(ctx))

	responseDataDeal({
		ctx,
		data,
	})

})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router