const Router = require('@koa/router')
const Day = require('dayjs')
const { dealErr, notFound, Params, MovieModel, responseDataDeal, SearchModel, MOVIE_STATUS } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')
const { sortList } = require('../orderList')
const { sanitizersNameParams } = require('../../../../management/movie/utils')

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

	const [ currPage, pageSize, content, district, director, actor, language, classify, screen_time, sort ] = Params.sanitizers(ctx.query, {
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
				return typeof data == 'string' && !!data.length ? sanitizersNameParams(data) : {}
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
		name: 'classify',
		sanitizers: [ idDeal ]
	},
	{
		name: 'time',
		sanitizers: [
			function(data) {
        let response = {}
        if(typeof data !== 'string' || !data.length) {
          response.$lte = new Date()
        }else {
          const [ start, end ] = data.split('_')
          start && (response.$gte = Day(start).toDate())
          response.$lte = Day(end ? end : new Date()).toDate()
        }
        return response
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

  let match = {
    "info.screen_time": screen_time,
    ...content,
    status: MOVIE_STATUS.COMPLETE
  }

  if(!!classify) {
    match = { 
      ...match,
      "info.classify": {
        $in: [ classify ]
      },
    }
  }
  if(district) match["info.district"] = { $in: [ ...district ] }
  if(director) match["info.director"] = { $in: [ ...director ] }
  if(actor) match["info.actor"] = { $in: [ ...actor ] }
  if(language) match["info.language"] = { $in: [ ...language ] }

  const data = await MovieModel.aggregate([
    {
      $match: match
    },
    ...(Array.isArray(sort) ? 
      [
        {
          $sort: sort.reduce((acc, cur) => {
            acc[cur[0]] = cur[1]
            return acc
          }, {}) 
        }
      ]
    : 
    []),
    {
      $skip: currPage * pageSize
    },  
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'users', 
        localField: 'author', 
        foreignField: '_id', 
        as: 'author'
      }
    },
    {
      $unwind: {
        path: "$author",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'images', 
        localField: 'author.avatar', 
        foreignField: '_id', 
        as: 'author.avatar'
      }
    },
    {
      $unwind: {
        path: "$author.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'images', 
        localField: 'images', 
        foreignField: '_id', 
        as: 'images'
      }
    },
    {
      $lookup: {
        from: 'images', 
        localField: 'poster', 
        foreignField: '_id', 
        as: 'poster'
      }
    },
    {
      $unwind: {
        path: "$poster",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'classifies', 
        localField: 'info.classify', 
        foreignField: '_id', 
        as: 'info.classify'
      }
    },
    {
      $project: {
        name: 1,
        author: {
          _id: "$author._id",
          username: "$author.username",
          avatar: "$author.avatar.src"
        },
        images: "$images.src",
        publish_time: "$info.screen_time",
        classify: "$info.classify.name",
        poster: "$poster.src",
        createdAt: 1,
        updatedAt: 1,
        glance: 1,
        hot: 1,
        source_type: 1,
        status: 1,
        description: "$info.description",
        rate: {
          $divide: [ "$total_rate", "$rate_person" ]
        }
      }
    }
  ])
  .then(data => {

    const movieIdList = data.map(item => ({ movie: item._id }))

    //关键词搜索存储
    if(content) {
      SearchModel.findOneAndUpdate({
        key_word: content
      }, {
        $push: { hot: new Date() },
        $set: {
          match_movies: movieIdList
        }
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        if(!data) {
          const model = new SearchModel({
            key_word: content,
            match_movies: movieIdList,
            match_texts: [],
            hot: [new Date()],
            other: {},
          })
          model.save(function() {})
        }
      })
      .catch(err => {})
    }
    return {
      data
    }
  })
  .catch(err => {
    console.log(err, 2222)
    return dealErr(ctx)(err)
  })
  // .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})

module.exports = router