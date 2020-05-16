const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { _id } = ctx.query
  let res
  let result
  const data = await mongo.findOne('_movie_', {
    _id: mongo.dealId(_id)
  }, {
    modified_time: 0,
    source_type: 0,
    stauts: 0,
    related_to: 0,
  })
  .then(data => {
    const {
      info: {
        actor,
        director,
        district,
        classify,
        language,
      },
      tag,
      comment,
      author,
      same_film,
    } = data
    result = { ...data }
    return Promise.all([
      mongo.find("_actor_", {
        _id: { $in: [...actor] }
      }, {
        name: 1,
        other: 1
      }),
      mongo.find("_director_", {
        _id: { $in: [...director] }
      }, {
        name: 1
      }),
      mongo.find("_district_", {
        _id: { $in: [...district] }
      }, {
        name: 1
      }),
      mongo.find("_classify_", {
        _id: { $in: [...classify] }
      }, {
        name: 1,
      }),
      mongo.find("_language_", {
        _id: { $in: [...language] }
      }),
      mongo.find("_tag_", {
        _id: { $in: [...tag] }
      }, {
        text: 1
      }),
      mongo.find("_comment_", {
        _id:{$in: [...comment]},
        query: [
          {
            __type__: "sort",
            create_time: -1,
          },
          ["limit", 20]
        ]
      }, {
        "content.text": 1,
        user_info: 1,
      })
      .then(async (data) => {
        const _data = mongo.find("_user_", {
          _id: {$in: data.map(d => d.user_info)}
        }, {
          avatar: 1
        })
        return data.map(d => {
          const { user_info, ...next } = d
          const [avatar] = _data.filter(_d => _d._id === user_info)
          return {
            ...next,
            user_info,
            avatar
          }
        })
      }),
      mongo.find("_user_", {
        _id: author
      }, {name: 1}),
      mongo.find("_movie_", {
        _id: { $in: [...same_film.map(s => s.film)] }
      }, {
        name: 1
      })
    ])
  })
  .then(data => {
    const [
      actor,
      director,
      district,
      classify,
      language,
      tag,
      comment,
      author,
      same_film,
    ] = data
    const { info, same_film: originList, total_rate, rate_person, ...nextResult  } = result
    return {
      ...nextResult,
      info: {
        ...info,
        actor,
        director,
        district,
        classify,
        language
      },
      tag,
      comment,
      author,
      rate: total_rate / rate_person,
      same_film: originList.map(o => {
        const { film, ...nextO } = o
        const [name] = same_film.filter(s => s._id === film)
        return {
          ...nextO,
          film,
          name: name.name
        }
      })
    }
  })
  .catch(err => {
    console.log(err)
    return false
  })

  await withTry(mongo.update)("_movie", {
    _id: mongo.dealId(_id)
  }, {
    $inc: { glance: 1 }
  })

  if(!data) {
    res = {
      success: false,
      res: null
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
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/simple', Simple.routes(), Simple.allowedMethods())

module.exports = router