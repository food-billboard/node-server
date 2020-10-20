const Router = require('@koa/router')
const { dealErr, notFound, Params, MovieModel, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')
const { sortList } = require('../orderList')

const elasticsearch = require('elasticsearch')

// const esClient = new elasticsearch.Client({
//   host:'127.0.0.1:9200',
//   log: 'error'
// })


// 关键字数据库查找，找到了则直接通过match_movies找到相关电影id以及是否与之前匹配的字段仍然匹配，匹配则记录，否则删除
// 没有找到则遍历电影数据库一一查找字段进行匹配，匹配则记录，并添加至match_movies
// 返回

const router = new Router()

// { content: 搜索内容, area: 地区, director: 导演, actor: 演员, lang: 语言, price: 价格, sort: 排序, time: 时间, fee: 免付费, currPage: 当前页, pageSize: 数量 }

router
.get('/', async(ctx) => {

  const idDeal = (data) => {
    if(typeof data !== 'string') return undefined
    if(data.indexOf(',')) {
      const ids = data.split(',').map(item => item.trim()).filter(item => ObjectId.isValid(item)).map(item => ObjectId(item))
      return !!ids.length ? ids : undefined
    }
    return ObjectId.isValid(data) ? [ ObjectId(data) ] : undefined
  } 

	const [ currPage, pageSize, content, district, director, actor, language, screen_time, sort ] = Params.sanitizers(ctx.query, {
		name: 'currPage',
		_default: 0,
		type: [ 'toInt' ],
		sanitizers: [
      data => data >= 0 ? data : -1
    ]
	}, {
		name: 'pageSize',
		_default: 30,
		type: [ 'toInt' ],
		sanitizers: [
      data => data >= 0 ? data : -1
    ]
	}, {
		name: 'content',
		sanitizers: [
			function(data) {
				return typeof data == 'string' && !!data.length ? data : undefined
			}
		]
	},
	{
		name: 'area',
		sanitizers: [ idDeal ]
	},
	{
		name: 'director',
		sanitizers: [ idDeal ]
	},
	{
		name: 'actor',
		sanitizers: [ idDeal ]
	},
	{
		name: 'lang',
		sanitizers: [ idDeal ]
	},
	{
		name: 'time',
		sanitizers: [
			function(data) {
				return !!date ? new Date(data).toString() : new Date().toString()
			}
		]
  },
  {
		name: 'sort',
		sanitizers: [
			function(data) {
        if(typeof data !== 'string') return undefined
        if(data.includes(',')) {
          const realData = data.split(',').filter(item => !!~item.indexOf('=')).map(item => item.trim().split('=')).filter(item => sortList.some(sort => item[0].toUpperCase() === sort._id)).map(item => [ item[0].toLowerCase(), item[1] >= 0 ? 1 : -1 ])
          return !!realData.length ? realData : undefined
        }
        const realData = data.trim().split('=')
        return realData.length == 1 && !~sortList.findIndex(val => val._id === realData[0].toUpperCase()) ? undefined : [ [ realData[0].toLowerCase(), realData[1] >= 0 ? 1 : -1 ] ]
			}
		]
  })
  
  //数据库操作
  const data = await MovieModel.find({
    //内容搜索
    ...(!!content ? {
      $or: [
        {
          name: content
        },
        {
          "info.another_name": { $in: [ content ] }
        },
        {
          "info.description": content
        },
        {
          author_description: content
        },
        // {
        //   source_type: content
        // },
        // {
        //   status: content
        // }
      ]
    } : {} ),
    ...(!!district ? {
      "info.district": { $in: [ ...district ] }
    } : {}),
    ...(!!director ? {
      "info.director": { $in: [ ...director ] }
    } : {}),
    ...(!!actor ? {
      "info.actor": { $in: [ ...actor ] }
    } : {}),
    ...(!!language ? {
      "info.language": { $in: [ ...language ] }
    } : {}),
    ...(!!screen_time ? {
      "info.screen_time": screen_time
    } : {})
  })
  .select({
    "info.description": 1,
    name: 1,
    poster: 1,
    "info.classify": 1,
    "info.screen_time": 1,
    hot: 1,
    total_rate: 1,
    rate_person: 1
  })
  .populate({
    path: 'info.classify',
    select: {
      name: 1,
      _id: 0
    }
  })
  .sort({
    ...(
      !!sort ? 
      sort.reduce((acc, cur) => {
        acc[cur[0]] = cur[1]
        return acc
      }, {}) 
      : 
      {}
    )
  })
  .skip((currPage >= 0 && pageSize >= 0) ? pageSize * currPage : 0)
	.limit(pageSize >= 0 ? pageSize : 10)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return {
      data: data.map(item => {
        const { _doc: { info: { screen_time, ...nextInfo }, total_rate, rate_person, poster, ...nextItem } } = item
        const rate = total_rate / rate_person
        return {
          ...nextItem,
          ...nextInfo,
          publish_time: screen_time,
          poster: poster && poster.src ? poster.src : null,
          store: false,
          rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1)
        }
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})

module.exports = router