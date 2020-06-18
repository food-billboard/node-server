const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')
const { ClassifyModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
  })

  const { currPage=0, pageSize=30, _id, sort={} } = ctx.query
  let res
	const data = await ClassifyModel.findOneAndUpdate({
		_id: ObjectId(_id)
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
			hot: 1
		},
		options: {
			limit: pageSize,
			skip: currPage * pageSize,
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
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router