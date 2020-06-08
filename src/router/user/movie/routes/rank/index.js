const Router = require('@koa/router')
const SpecDropList = require('./specDropList')
const { RankModel, dealErr, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
	let res
	const data = await RankModel.findOneAndUpdate({
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
			"info.classify": 1,
			poster: 1,
			publish_time: 1,
			hot: 1
		},
		options: {
			limit: pageSize,
			skip: currPage * pageSize
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
					poster: src
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