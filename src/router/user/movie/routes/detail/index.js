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
  const data = await mongo.findOne('movie', { 
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
      mongo.find("actor", {
        _id: { $in: [...actor] }
      }, {
        name: 1,
        other: 1,
        _id: 0
      }),
      mongo.find("director", {
        _id: { $in: [...director] }
      }, {
        name: 1,
        _id: 0
      }),
      mongo.find("district", {
        _id: { $in: [...district] }
      }, {
        name: 1,
        _id: 0
      }),
      mongo.find("classify", {
        _id: { $in: [...classify] }
      }, {
        name: 1,
        _id: 0
      }),
      mongo.find("language", {
        _id: { $in: [...language] }
      }, {
        _id: 0,
        name: 1
      }),
      mongo.find("tag", {
        _id: { $in: [...tag] }
      }, {
        text: 1,
        _id: 0
      }),
      mongo.find("comment", {
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
        _id: 0
      })
      .then(async (data) => {
        const _data = await mongo.find("user", {
          _id: {$in: [...data.map(d => d.user_info)]}
        }, {
          avatar: 1
        })
        return data.map(d => {
          const { user_info, ...next } = d
          
          const [avatar] = _data.filter(_d => _d._id.toString() == user_info.toString())
          const { _id, ...nextData } = avatar
          return {
            ...next,
            ...nextData
          }
        })
      }),
      mongo.findOne("user", {
        _id: author
      }, {username: 1, _id: 0}),
      mongo.find("movie", {
        _id: { $in: [...same_film.map(s => s.film)] }
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
    const { info, same_film: originList, total_rate, rate_person, ...nextResult  } = result
    const { username } = author
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
      author: {
        username
      },
      rate: total_rate / rate_person,
      same_film: originList.map(o => {
        const { film, ...nextO } = o
        const [name] = same_film.filter(s => {
          return s._id.toString() == film.toString()
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