const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr } = require('@src/utils')

const router = new Router()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30 } = ctx.query
  let res

  const data = await UserModel.findOne({
    mobile: ~~mobile
  })
  .select({
    comment: 1
  })
  .populate({
    path: 'comment',
    options: {
      limit: pageSize,
      skip: currPage * pageSize
    },
    select: {
      source: 1,
      create_time: 1,
      total_like: 1,
      content: 1,
      like_person: 1
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
    const { _id, comment } = data
    let like = false
    return {
      comment: comment.map(c => {
        like = false
        const { like_person, ...nextC } = c
        if(like_person.some(l => mongo.equalId(l, customerId))) {
          like = true
        }
        return {
          ...nextC,
          like
        }
      })
    }
  })
  .catch(dealErr(ctx))

  // let result
  // let customerId
  // //查找评论id
  // const data = await mongo.connect("user")
  // .then(db => db.findOne({mobile: Number(mobile)}, {
  //   projection: {
  //     comment: 1
  //   }
  // }))
  // .then(data => {
  //   const { comment, _id } = data
  //   if(comment && !comment.length) return Promise.reject({err: null, data: []})
  //   customerId = _id
  //   return mongo.connect("comment")
  //   .then(db => db.find({
  //     _id: { $in: [...comment] }
  //   }, {
  //     projection: {
  //       source: 1,
  //       create_time: 1,
  //       total_like: 1,
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
  //   let movies = []
  //   let users = []
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
  //       projection : {
  //         name: 1
  //       }
  //     }))
  //     .then(data => data.toArray())
  //   ])
  // })
  // .then(([ users, movies ]) => {
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
  //     }else if(type === 'movie') {
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