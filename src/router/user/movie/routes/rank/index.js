const Router = require('@koa/router')
const SpecDropList = require('./specDropList')
const { MongoDB } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
	let result
	let errMsg
  const data = await mongo.connect("rank")
  .then(db => db.findOne({
	  _id: mongo.dealId(_id)
  }, {
	projection: {
		match: 1
	}
  }))
  .then(data => {
		return mongo.connect("movie")
		.then(db => db.find({}, {
			projection: {
				"info.classify": 1,
				poster: 1,
				publish_time: 1,
				hot: 1
			},
			sort: {
				...data.match.reduce((acc, da) => {
							acc[da] = -1
							return acc
						}, {})
			},
			limit: pageSize,
			skip: pageSize * currPage
		}))
  })
  .then(data => data.toArray())
  .then(data => {
	  result = [...data]
	  return Promise.all(data.map(d => {
		  const { info: { classify } } = d
		  return mongo.connect("classify")
		  .then(db => db.find({
			  _id: { $in: [...classify] }
		  }, {
			  projection: {
				  name: 1
			  }
		  }))
		  .then(data => data.toArray())
	  }))
  })
  .then(data => {
	  return result.map((r, i) => {
		  const { info } = r
		  return {
			  ...r,
			  info: {
				  ...info,
				  classify: data[i]
			  }
		  }
	  })
  })
  .catch(err => {
		console.log(err)
		errMsg = err
    return false
  })
  
  if(errMsg) {
    res = {
      success: false,
      res: {
        errMsg
      }
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