const Router = require('@koa/router')
const { MongoDB, dealErr } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { _id, currPage=0, pageSize=30 } = ctx.query
  //将传递的id数据进行整合
  const idList = []
  let res
  let result
  const data = await mongo.connect("movie")
  .then(db => db.find({
    "info.classify": { $in: [...idList] }	  
  }, {
    skip: pageSize * currPage,
	limit: pageSize,
	projection: {
	  name: 1,
	  "info.name": 1,
	  "info.classify": 1,
	  create_time: 1,
	  hot: 1,
	  poster: 1
	}
  }))
  .then(data => data.toArray())
  .then(data => {
	result = [...data]
	let idList = []
	result.forEach(r => {
	  const { info: { classify } } = r
	  classify.forEach(c => {
	    if(!idList.every(i => mongo.equalId(i, c))) {
		  idList.push(c)
		}			
	  })
	})
	return mongo.connect("classify")
	.then(db => db.find({
	  _id: { $in: [...idList] }
	}, {
	  name: 1,	  
	}))
  })
  .then(data => data.toArray())
  .then(data => {
    return result.map(re => {
	  const { info, ...nextRe } = re
	  const { classify } = info
	  let newClassify = []
	  classify.forEach(c => {
	    data.forEach(d => {
		  const { name, _id } = d
		  if(mongo.equalId(_id, c)) {
		    newClassify.push({
			  _id,
			  name
			})	  
		  }
		})	  
	  })
	  
	  return {
	    ...nextRe,
		info: {
		  ...info,
		  classify: newClassify
		}
	  }
	})
  })
  .catch(dealErr(ctx))
  
  if(data) {
	res = {
	  success: true,
	  res: {
        data		  
	  }
	}
  }
  
  ctx.body = JSON.stringify(res)
})

module.exports = router