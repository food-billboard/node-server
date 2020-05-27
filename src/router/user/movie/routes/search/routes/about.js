const Router = require('@koa/router')
const { MongoDB, dealErr } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { content: 关键字 }

router.get('/', async (ctx) => {
  const { content } = ctx.query
  let res
  const data = await mongo.connect("search")
  .then(db => db.find({
    key_word: content  
  }, {
    projection: {
	  match_texts: 1
	}
  }))
  .then(data => data.toArray())
  .then(data => {
    return data.map(d => {
	  const { match_texts } = d
	  return match_texts
	})
	.flat(Infinity)
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