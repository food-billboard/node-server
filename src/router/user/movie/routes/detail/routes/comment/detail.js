const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res 
  let result
  const data = await mongo.connect("comment")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      source: 0,
      like_person: 0,
    }
  }))
  .then(data => {
    const { sub_comments, comment_users, ...nextComment } = data  
    result = {
      sub: [],
      comment: {...nextComment, comment_users: comment_users.length}
    }
    const len = sub_comments.length
    const skip = currPage * pageSize
    if(skip >= len) {
      return []
    }else {
      return mongo.connect("comment")
      .then(db => db.find({
        _id: { $in: [...sub_comments] }
      }, {
        projection: {
          sub_comments: 0,
          source: 0,
          like_person: 0
        }
      }))
      .then(data => data.toArray())
    }
  })
  .then(data => {
    result = {
      ...result,
      sub: [...data]
    }
    let newListId = []
    let listId = data.map(d => {
      const { user_info, comment_users } = d
      return [user_info, ...comment_users]
    })
    listId.flat(Infinity).forEach(id => {
      if(!newListId.some(i => mongo.equalId(i, id))) newListId.push(id)
    })
    return data.length ?
    mongo.connect("user")
    .then(db => db.find({
      _id: { $in: [...newListId] }
    }, {
      projection: {
        avatar: 1,
        username: 1
      }
    }))
    .then(data => data.toArray())
    : []
  })
  .then(data => {
    const { sub } = result
    let _sub = [...sub]
    sub.forEach((r, i) => {
      const { comment_users, user_info } = r
      let _comment_users = []
      let _user_info = false
      data.forEach(d => {
        const { _id, avatar, username } = d
        comment_users.forEach(c => {
          if(mongo.equalId(_id, c)) {
            _comment_users.push({
              _id,
              avatar
            })
          }
        })
        if(!_user_info && mongo.equalId(_id, user_info)) {
          _user_info = {
            _id,
            avatar,
            username
          }
        }
      })
      _sub[i] = { ..._sub[i], user_info: _user_info, comment_users: _comment_users }
    })
    result = {
      ...result,
      sub: [..._sub]
    }
    return result
  })
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) {
    res = {
      success: false,
      res: {
        errMsg: '服务器错误'
      }
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