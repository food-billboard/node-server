const { MongoDB } = require("@src/utils")
const mongo = MongoDB()

const getMessageList = socket => async (data) => {
  const [, token] = verifyTokenToData(data)
  const { mobile } = token
  let res
  let errMsg
  let result
  let mine
  const message = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id } = data
    mine = _id
  })
  .then(_ => mongo.connect("room"))
  .then(db => db.find({
    "member.user": mine
  }))
  .then(data => data.toArray())
  .then(data => {
    result = [...data]
  })
  .then(_ => {
    const userList = []
    const messageList = []
    result.forEach(re => {
      const { member, type } = re
      let message
      //找到自己的消息记录
      const index = member.findIndex(val => mongo.equalId(val.user, mine))
      message = member[index].message
      //只有在普通聊天的情况下需要额外获取聊天对方信息
      if(type === 'chat') {
        member.forEach(m => {
          const { user } = m
          if(!userList.some(u => mongo.equalId(u, user)) && !mongo.equalId(u, mine)) {
            userList.push(user)
          } 
        })
      }

      messageList = [...message]
    })
    return Promise.all([
      mongo.connect("user")
      .then(db => db.find({
        _id: { $in: [...userlist] }
      }, {
        projection: {
          avatar: 1,
          username: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("message")
      .then(db => db.find({
        _id: { $in: [...messageList.filter(m => !m.readed).map(m => m.id)] },
      }, {
        sort: {
          create_time: -1
        },
        projection: {
          "content.text": 1,
          create_time: 1
        }
      }))
      .then(data => data.toArray())
    ])
  })
  .then(data => {
    const [ userList, messageList ] = data
    return result.map(re => {
      const { member, type, info, ...nextRe } = re
      const index = member.findIndex(val => mongo.equalId(val.user, mine))
      let message = member[index].message
      let newInfo = {}
      let messageCount = 0
      let time = -1
      let lastData = ''
      if(type === 'chat') {
        member.forEach(mem => {
          const index = userlist.findIndex(val => {
            const { _id } = val
            return mongo.equalId(_id, mem)
          })
          if(~index) {
            const { avatar, username } = userList[index]
            newInfo = { 
              avatar,
              name: username
            }
          }
        })
      }
      message.forEach(mes => {
        const index = messagelist.findIndex(val => mongo.equalId(mes.id, val._id))
        if(~index) {
          const { content: {text}, create_time }  = messageList[index]
          if(create_time > time) {
            lastData = text
            time = create_time
          }
          messageCount ++
        }
      })

      return {
        ...nextRe,
        info: {
          ...info,
          ...newInfo
        },
        message: {
          count: messageCount,
          lastData,
          time
        }
      }
    })
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })
  
  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: {
        data: message
      }
    }
  }
  
  socket.emit("get", JSON.stringify(res))
}

module.exports = getMessageList