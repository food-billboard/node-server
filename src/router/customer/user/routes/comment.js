const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res

  const data = await UserModel.find({
    $or: [ { mobile: Number(mobile) }, { _id: mongo.dealId(_id) } ]
  })
  .select({
    comment: 1
  })
  .populate({
    path: 'comment',
    match: {
      user_info: ObjectId(_id)
    },
    select: {
      source: 1,
      createdAt: 1,
      toal_like: 1,
      content: 1,
      like_person: 1
    },
    options: {
      limit: pageSize,
      skip: currPage * pageSize
    },
    populate: {
      path: 'source_movie',
      select: {
        name: 1
      }
    },
    populate: {
      path: 'source_user',
      select: {
        content: 1
      }
    }
  })
  .exec()
  .then(data => {
    let result = {}
    let mine = {}
    const index = data.findIndex(d => d.user_info.equals(_id))
    if(!~index) return Promise.reject({err: null, data: []})
    result = {
      ...data[index]
    } 
    mine = {
      ...data[(index + 1) % 2]
    }
    const { _id:mineId } = mine
    const { _id, comment } = result
    let like = false
    return {
      comment: comment.map(c => {
        const { like_person, ...nextC } = comment
        like = false
        if(like_person.some(l => l.equals(mineId))) like = true
        return {
          ...nextC,
          like
        }
      })
    }
  })
  .catch(dealErr(ctx))

  // let customerId
  // //查找评论id
  // const data = await mongo.connect("user")
  // .then(db => db.findOne({
  //   $or: [ { mobile: Number(mobile) }, { _id: mongo.dealId(_id) } ]
  // }, {
  //   projection: {
  //     comment: 1
  //   }
  // }))
  // .then(data => {
  //   if(data && data.length != 2) return Promise.reject({err: null, data: []})
  //   let comments
  //   data.forEach(d => {
  //     const { comment, _id:id } = d
  //     if(mongo.equalId(id, _id)) {
  //       comments = [...comment]
  //     }else {
  //       customerId = id
  //     }
  //   })
  //   return mongo.connect("comment")
  //   .then(db => db.find({
  //     _id: { $in: [...comments] }
  //   }, {
  //     projection: {
  //       source: 1,
  //       create_time: 1,
  //       toal_like: 1,
  //       content: 1,
  //       like_person: 1
  //     },
  //     limit: pageSize,
  //     skip: currPage * pageSize
  //   }))
  //   .then(data => data.toArray())
  // })
  // .then(data => {
  //   result = [...data]
  //   let users = []
  //   let movies = []
  //   data.forEach(d => {
  //     const { source: { type, comment } } = d
  //     if(type === 'USER'){
  //       users.push(comment)
  //     }
  //     if(type === 'MOVIE') {
  //       movies.push(comment)
  //     }
  //   })
  //   return Promise.all([
  //     mongo.connect("comment")
  //     .then(db => db.find({
  //       _id: { $in: [...comments] }
  //     }, {
  //       projection: {
  //         content: 1
  //       }
  //     }))
  //     .then(data => data.toArray()),
  //     mongo.connect("movie")
  //     .then(db => db.find({
  //       _id: { $in: [ ...movies ] }
  //     }, {
  //       projection: {
  //         name: 1
  //       }
  //     }))
  //     .then(data => data.toArray())
  //   ])
  // })
  // .then((users, movies) => {
  //   let newData = []
  //   result.forEach(re => {
  //     const { source: { type, comment }, like_person, ...nextRe } = re
  //     let like = false
  //     if(like_person.some(l => mongo.equalId(l, customerId))) {
  //       like = true
  //     }
  //     if(type === 'USER') {
  //       let newRe = {
  //         ...nextRe,
  //         source: {
  //           type,
  //           comment,
  //           content: users.filter(d => mongo.equalId(d._id, comment))[0].content
  //         },
  //         like
  //       }
  //       newData.push(newRe)
  //     }else if(type === 'MOVIE') {
  //       newData.push({
  //         ...nextRe,
  //         source: {
  //           type,
  //           comment,
  //           content: movies.filter(d => mongo.equalId(d._id, comment))[0].name
  //         },
  //         like
  //       })
  //     }

  //   })
  //   return newData
  // })
  // .catch(err => {
  //   if(isType(err, "object") && err.data) return err.data
  //   console.log(err)
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
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

module.exports = router