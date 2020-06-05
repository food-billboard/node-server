const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')
const { MongoDB } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { _id } = ctx.query
  let res
  let result
  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      modified_time: 0,
      source_type: 0,
      stauts: 0,
      related_to: 0,
    }
  }))
  .then(data => {
    const {
      rest={},
      ...nextData
    } = data
    result = { ...nextData, store: false }
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
    } = result
    return Promise.all([
      mongo.connect("actor")
      .then(db => db.find({
        _id: { $in: [...actor] }
      }, {
        projection: {
          name: 1,
          "other.avatar": 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.actor || []).map(r => ({
            name: r,
            other: {
              avatar: null
            }
          }))
        )
      ]),
      mongo.connect("director")
      .then(db => db.find({
        _id: { $in: [...director] }
      }, {
        projection: {
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.director || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("district")
      .then(db => db.find({
        _id: { $in: [...district] }
      }, {
        projection: {
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.district || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("classify")
      .then(db => db.find({
        _id: { $in: [...classify] }
      }, {
        projection: {
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.classify || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("language")
      .then(db => db.find({
        _id: { $in: [...language] }
      }, {
        projection: {
          _id: 0,
          name: 1
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.language || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("tag")
      .then(db => db.find({
        _id: { $in: [...tag] }
      }, {
        projection: {
          text: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("comment")
      .then(db => db.find({
        _id: { $in: [...comment] }
      }, {
        projection: {
          "content.text": 1,
          user_info: 1,
          _id: 0
        },
        sort: {
          create_time: -1
        },
        limit: 20
      }))
      .then(data => data.toArray())
      .then(async(data) => {
        const _data = await mongo.connect("user")
        .then(db => db.find({
          _id: { $in: [...data.map(d => d.user_info)] }
        }, {
          projection: {
            avatar: 1
          }
        }))
        .then(data => data.toArray())
        return data.map(d => {
          const { user_info, ...next } = d
          const [avatar] = _data.filter(_d => mongo.equalId(_d._id, user_info))
          const { _id, ...nextData } = avatar
          return {
            ...next,
            ...nextData
          }
        })
      }),
      mongo.connect("user")
      .then(db => db.findOne({
        _id: author
      }, {
        projection: {
          username: 1,
          _id: 0
        }
      })),
      mongo.connect("movie")
      .then(db => db.find({
        _id: { $in: [...same_film.map(s => s.film)] }
      }, {
        projection: {
          name: 1
        }
      }))
      .then(data => data.toArray())
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
    const { info, same_film: originList, total_rate, rate_person, status, ...nextResult  } = result
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
      comment: comment.map(c => {
        const { avatar, ...nextC } = c
        return {
          ...nextC,
          user_info: {
            avatar
          }
        }
      }),
      author: {
        username
      },
      rate: total_rate / rate_person,
      same_film: originList.map(o => {
        const { film, ...nextO } = o
        const [name] = same_film.filter(s => {
          return mongo.equalId(s._id, film)
        })
        if(name) return {
          ...nextO,
          film,
          name: name.name
        }
      }).filter(f => !!f)
    }
  })
  .catch(err => {
    console.log(err)
    return false
  })

  await mongo.connect("movie")
  .then(db => db.updateOne({
    _id: mongo.dealId(_id)
  }, {
    $inc: { glance: 1 }
  }))
  .catch(err => {
    console.log(err)
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