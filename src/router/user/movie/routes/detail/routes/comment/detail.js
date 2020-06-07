const Router = require('@koa/router')
const { CommentModel, dealErr } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res 
  const user_info = {
    path: 'user_info',
    select: {
      avatar: 1,
      username: 1
    }
  }
  const data = await CommentModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    source: 0,
    like_person: 0,
  })
  .populate(user_info)
  .populate({
    path: 'sub_comments',
    select: {
      sub_comments: 0,
      source: 0,
      like_person: 0
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage
    },
    populate: {...user_info},
    populate: { ...user_info, path: 'comment_users' }
  })
  .exec()
  .then(data => {
    const { sub_comments, comment_users, ...nextComment } = data
    return {
      sub: [...sub_comments],
      comment: {
        ...nextComment,
        comment_users: comment_users.length
      }
    }
  })
  .catch(dealErr(ctx))
  // let result
  // const data = await mongo.connect("comment")
  // .then(db => db.findOne({
  //   _id: mongo.dealId(_id)
  // }, {
  //   projection: {
  //     source: 0,
  //     like_person: 0,
  //   }
  // }))
  // .then(data => {
  //   const { sub_comments, comment_users, ...nextComment } = data  
  //   result = {
  //     sub: [],
  //     comment: {...nextComment, comment_users: comment_users.length}
  //   }
    // const len = sub_comments.length
    // const skip = currPage * pageSize
    // if(skip >= len) {
    //   return []
    // }else {
    //   return mongo.connect("comment")
    //   .then(db => db.find({
    //     _id: { $in: [...sub_comments] }
    //   }, {
    //     projection: {
    //       sub_comments: 0,
    //       source: 0,
    //       like_person: 0
    //     }
    //   }))
    //   .then(data => data.toArray())
    // }
  // })
  // .then(data => {
  //   result = {
  //     ...result,
  //     sub: [...data]
  //   }
  //   let newListId = []
  //   let listId = data.map(d => {
  //     const { user_info, comment_users } = d
  //     return [user_info, ...comment_users]
  //   })
  //   listId.push(result.comment.user_info)
  //   listId.flat(Infinity).forEach(id => {
  //     if(!newListId.some(i => mongo.equalId(i, id))) newListId.push(id)
  //   })
  //   return data.length ?
  //   mongo.connect("user")
  //   .then(db => db.find({
  //     _id: { $in: [...newListId] }
  //   }, {
  //     projection: {
  //       avatar: 1,
  //       username: 1
  //     }
  //   }))
  //   .then(data => data.toArray())
  //   : []
  // })
  // .then(data => {
  //   const { sub, comment: { user_info:originUser } } = result
  //   let _sub = [...sub]
  //   sub.forEach((r, i) => {
  //     const { comment_users, user_info } = r
  //     let _comment_users = []
  //     let _user_info = false
  //     data.forEach(d => {
  //       const { _id, avatar, username } = d
  //       comment_users.forEach(c => {
  //         if(mongo.equalId(_id, c)) {
  //           _comment_users.push({
  //             _id,
  //             avatar
  //           })
  //         }
  //       })
  //       if(!_user_info && mongo.equalId(_id, user_info)) {
  //         _user_info = {
  //           _id,
  //           avatar,
  //           username
  //         }
  //       }
  //     })
  //     _sub[i] = { ..._sub[i], user_info: _user_info, comment_users: _comment_users }
  //   })
  //   //楼主信息
  //   const index = data.findIndex(d => mongo.equalId(originUser, d._id))
  //   if(~index) result.comment.user_info = {
  //     ...data[index]
  //   }
  //   result = {
  //     ...result,
  //     sub: [..._sub]
  //   }
  //   return result
  // })
  // .catch(err => {
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