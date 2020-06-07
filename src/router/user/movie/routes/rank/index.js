const Router = require('@koa/router')
const SpecDropList = require('./specDropList')
const { RankModel, dealErr } = require("@src/utils")
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
		match: 1
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
	.then(data => data)
	.catch(dealErr(ctx))

	// let result
	// let errMsg
  // const data = await mongo.connect("rank")
  // .then(db => db.findOne({
	//   _id: mongo.dealId(_id)
  // }, {
	// projection: {
	// 	match: 1
	// }
  // }))
  // .then(data => {
	// 	return mongo.connect("movie")
	// 	.then(db => db.find({}, {
	// 		projection: {
	// 			"info.classify": 1,
	// 			poster: 1,
	// 			publish_time: 1,
	// 			hot: 1
	// 		},
	// 		sort: {
	// 			...data.match.reduce((acc, da) => {
	// 						acc[da] = -1
	// 						return acc
	// 					}, {})
	// 		},
	// 		limit: pageSize,
	// 		skip: pageSize * currPage
	// 	}))
  // })
  // .then(data => data.toArray())
  // .then(data => {
	//   result = [...data]
	//   return Promise.all(data.map(d => {
	// 	  const { info: { classify } } = d
	// 	  return mongo.connect("classify")
	// 	  .then(db => db.find({
	// 		  _id: { $in: [...classify] }
	// 	  }, {
	// 		  projection: {
	// 			  name: 1
	// 		  }
	// 	  }))
	// 	  .then(data => data.toArray())
	//   }))
  // })
  // .then(data => {
	//   return result.map((r, i) => {
	// 	  const { info } = r
	// 	  return {
	// 		  ...r,
	// 		  info: {
	// 			  ...info,
	// 			  classify: data[i]
	// 		  }
	// 	  }
	//   })
  // })
  // .catch(err => {
	// 	console.log(err)
	// 	errMsg = err
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