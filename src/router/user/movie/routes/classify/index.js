const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')
const { MongoDB, isType } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router
.get('/', async(ctx) => {
  const { currPage=0, pageSize=30, _id, sort } = ctx.query
  let res
  let result
  const data = await mongo.connect("movie")
  .then(db => db.find({
	  "info.classify": { $in: [mongo.dealId(_id)] }
  }, {
	  sort: sort ? ( isType(sort, 'array') ? [...sort] : {...sort} ) : [],
	  limit: pageSize,
	  skip: currPage * pageSize,
	  projection: {
		poster: 1,
		name: 1,
		"info.classify": 1,
		publish_time: 1,
		hot: 1
	  }
  }))
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
				name: 1,
				_id: 0
			}
		}))
		.then(data => data.toArray())
	}))
  })
  .then(data => {
	return result.map((r, i) => {
		const { info: { classify, ...nextInfo } } = r
		return {
			...r,
			info: {
				...nextInfo,
				classify: data[i]
			}
		}
	})
  })
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) {
    res = {
      success: false,
      res: {
        errMsg: '服务器错误'
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