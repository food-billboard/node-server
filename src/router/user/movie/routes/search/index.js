const Router = require('@koa/router') 
const About = require('./routes/about')
const Query = require('./routes/query')
const { MongoDB } = require('@src/utils')


// 关键字数据库查找，找到了则直接通过match_movies找到相关电影id以及是否与之前匹配的字段仍然匹配，匹配则记录，否则删除
// 没有找到则遍历电影数据库一一查找字段进行匹配，匹配则记录，并添加至match_movies
// 返回

const router = new Router()
const mongo = MongoDB()

// { content: 搜索内容, area: 地区, director: 导演, actor: 演员, lang: 语言, price: 价格, sort: 排序, time: 时间, fee: 免付费, currPage: 当前页, pageSize: 数量 }

router
.get('/', async(ctx) => {
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
    currPage=0, 
    pageSize=30 
  } = ctx.query
  
})
.use('./about', About.routes(), About.allowedMethods())
.use('./query', Query.routes(), Query.allowedMethods())

module.exports = router