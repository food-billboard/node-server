const Router = require('@koa/router') 
const About = require('./routes/about')
const Query = require('./routes/query')
const { MongoDB } = require('@src/utils')


// 关键字数据库查找，找到了则直接通过match_movies找到相关电影id以及是否与之前匹配的字段仍然匹配，匹配则记录，否则删除
// 没有找到则遍历电影数据库一一查找字段进行匹配，匹配则记录，并添加至match_movies
// 返回

// const text = ''
// const [, data] = await withTry(mongo.find)("_search_", {
// 	key_word: /\/i
// }, {
// 	key_word: 1,
// 	match_texts: 1,
// 	match_movies: 1
// })
// //无匹配关键词
// if(!data.length) {
// 	const [, movie_list] = await withTry(mongo.find)("_movie_")
// 	movie_list.
// }else {
// 	let movies = data.map(d => d.match_movies).flat(Infinity).reduce((acc, item) => {
// 		if(!acc.includes(item)) {
// 			acc.push(item)
// 		}
// 		return acc
// 	}, [])
// 	mongo.find("_movie_", {
// 		$or: data.map(d => {
// 			const { match_movies } = d
// 			return {_id: }
// 		})
// 	})
// }

const router = new Router()
const mongo = MongoDB()

// { content: 搜索内容, area: 地区, director: 导演, actor: 演员, lang: 语言, price: 价格, sort: 排序, time: 时间, fee: 免付费, currPage: 当前页, pageSize: 数量 }

router
.get('/', async(ctx) => {
  ctx.body = '关键词搜索'
  const { 
    content, 
    area, 
    director, 
    actor, 
    lang, 
    price, 
    sort, 
    time, 
    fee, 
    currPage, 
    pageSize 
  } = ctx.query
  
})
.use('./about', About.routes(), About.allowedMethods())
.use('./query', Query.routes(), Query.allowedMethods())

module.exports = router