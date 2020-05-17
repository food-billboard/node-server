const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res 
  let result
  const data = await mongo.findOne("comment", {//_comment_
    _id: mongo.dealId(_id)
  })
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
      return mongo.find("comment", {//_comment_
        _id: { $in: [...sub_comments.map(s => mongo.dealId(s))] }
      }, {
        sub_comments: 0,
        source: 0,
        like_person: 0
      })
    }
  })
  .then(data => {
    result = {
      ...result,
      sub: [...data]
    }
    let listId = data.map(d => {
      const { user_info, comment_users } = d
      return [user_info, ...comment_users]
    })
    listId = listId.flat(Infinity)
    return data.length ?
    mongo.find("user", {//_user_
      _id: { $in: [...listId.map(l => mongo.dealId(l))] }
    }, {
      avatar:1
    }) 
    : []
  })
  .then(data => {
    const { comment, sub } = result
    let _sub = [...sub]
    sub.forEach((r, i) => {
      const { comment_users, user_info } = r
      let _comment_users = []
      let _user_info = ''
      data.forEach(d => {
        const { _id, avatar } = d
        let index = comment_users.indexOf(_id)
        if(user_info == _id) {
          _user_info = {
            _id: user_info,
            avatar: avatar
          }
        }
        if(index > -1) {
          _comment_users.push({
            _id,
            avatar
          })
        }
      })
      _sub[i] = { ..._sub[i], user_info: _user_info, comment_users: _comment_users }
    })
    result = {
      ...result,
      comment,
      sub: [..._sub]
    }
    return result
  })
  .catch(err => {
    console.log(err)
    return false
  })

  if(data) {
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
})

module.exports = router