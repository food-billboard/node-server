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
  const data = await mongo.findOne('movie', { //_movie_
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
      mongo.find("actor", {//_actor_
        _id: { $in: actor.map(a => mongo.dealId(a)) }
      }, {
        name: 1,
        other: 1,
        _id: 0
      }),
      mongo.find("director", {//_director_
        _id: { $in: director.map(d => mongo.dealId(d)) }
      }, {
        name: 1,
        _id: 0
      }),
      mongo.find("district", {//_district_
        _id: { $in: district.map(d => mongo.dealId(d)) }
      }, {
        name: 1,
        _id: 0
      }),
      mongo.find("classify", {//_classify_
        _id: { $in: classify.map(c => mongo.dealId(c)) }
      }, {
        name: 1,
        _id: 0
      }),
      mongo.find("language", {//_language_
        _id: { $in: language.map(l => mongo.dealId(l)) }
      }, {
        _id: 0,
        name: 1
      }),
      mongo.find("tag", {//_tag_
        _id: { $in: tag.map(t => mongo.dealId(t)) }
      }, {
        text: 1,
        _id: 0
      }),
      mongo.find("comment", {//_comment_
        _id:{$in: comment.map(c => mongo.dealId(c))},
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
        _id: 0
      })
      .then(async (data) => {
        const _data = await mongo.find("user", {//_user_
          _id: {$in: data.map(d => mongo.dealId(d.user_info))}
        }, {
          avatar: 1
        })
        return data.map(d => {
          const { user_info, ...next } = d
          const [avatar] = _data.filter(_d => _d._id == user_info)
          const { _id, ...nextData } = avatar
          return {
            ...next,
            ...nextData
          }
        })
      }),
      mongo.find("user", {//_user_
        _id: mongo.dealId(author)
      }, {username: 1, _id: 0}),
      mongo.find("movie", {//movie
        _id: { $in: [...same_film.map(s => mongo.dealId(s.film))] }
      }, {
        name: 1,
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
    console.log(author)
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
        const [name] = same_film.filter(s => {
          return s._id == film
        })
        if(name) return {
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