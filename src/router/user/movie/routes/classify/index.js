const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')
const { ClassifyModel, dealErr } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  const { currPage=0, pageSize=30, _id, sort={} } = ctx.query
  let res
	const data = await ClassifyModel.findOneAndUpdate({
		_id: ObjectId(_id)
	}, {
		$inc: { glance: 1 }
	})
	.select({
		name: 1,
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
		}
	})
	.exec()
	.then(data => data)
	.catch(dealErr(ctx))

  // const data = await mongo.connect("movie")
  // .then(db => db.find({
	//   "info.classify": { $in: [mongo.dealId(_id)] }
  // }, {
	//   sort: sort ? ( isType(sort, 'array') ? [...sort] : {...sort} ) : [],
	//   limit: pageSize,
	//   skip: currPage * pageSize,
	//   projection: {
	// 		poster: 1,
	// 		name: 1,
	// 		"info.classify": 1,
	// 		publish_time: 1,
	// 		hot: 1
	//   }
  // }))
  // .then(data => data.toArray())
  // .then(data => {
	// 	result = [...data]
	// 	return Promise.all(data.map(d => {
	// 		const { info: { classify } } = d
	// 		return mongo.connect("classify")
	// 		.then(db => db.find({
	// 			_id: { $in: [...classify] }
	// 		}, {
	// 			projection: {
	// 				name: 1,
	// 				_id: 0
	// 			}
	// 		}))
	// 		.then(data => data.toArray())
	// 	}))
  // })
  // .then(data => {
	// 	return result.map((r, i) => {
	// 		const { info: { classify, ...nextInfo } } = r
	// 		return {
	// 			...r,
	// 			info: {
	// 				...nextInfo,
	// 				classify: data[i]
	// 			}
	// 		}
	// 	})
  // })
  // .catch(err => {
  //   console.log(err)
  //   return false
  // })

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