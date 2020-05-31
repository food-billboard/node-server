const { MongoDB, verifySocketIoToken, otherToken } = require("@src/utils")
const mongo = MongoDB()

const getMessageList = socket => async (data) => {
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  let res
  let result
  //已登录
  if(token) {
    const { mobile } = token
    let mine
    await mongo.connect("user")
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
      let messageList = []
      result.forEach(re => {
        const { member, type } = re
        let message
        //找到自己的消息记录
        const index = member.findIndex(val => mongo.equalId(val.user, mine))
        message = member[index].message.filter(m => !m.readed)
        //只有在普通聊天的情况下需要额外获取聊天对方信息
        if(type === 'chat') {
          member.forEach(m => {
            const { user } = m
            if(!userList.some(u => mongo.equalId(u, user) && !mongo.equalId(u, mine))) {
              userList.push(user)
            } 
          })
        }
  
        messageList = [ ...messageList, ...message ]
      })
      return [ messageList, userList ]
    })
    .then(([ messageList, userList ]) => {
      return Promise.all([
        mongo.connect("user")
        .then(db => db.find({
          _id: { $in: [...userList] }
        }, {
          projection: {
            avatar: 1,
            username: 1
          }
        }))
        .then(data => data.toArray()),
        mongo.connect("message")
        .then(db => db.find({
          _id: { $in: [...messageList.map(m => m.id)] },
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
    .then(([ userList, messageList ]) => {
      return result
      .map(re => {
        const { member, type, info, ...nextRe } = re
        const index = member.findIndex(val => mongo.equalId(val.user, mine))
        let message = member[index].message
        let newInfo = {}
        let messageCount = 0
        let time = -1
        let lastData = ''
        if(type === 'chat') {
          member.forEach(mem => {
            const index = userList.findIndex(val => {
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
          const index = messageList.findIndex(val => mongo.equalId(mes.id, val._id))
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
            lastData: !messageCount ? '暂无新消息' : lastData,
            time: !messageCount ? Date.now() : time
          }
        }
      })
    })
    .then(data => {
      res = {
        success: true,
        res: {
          data
        }
      }
    })
    .catch(err => {
      if(err && err.errMsg) {
        res = {
          success: false,
          res: {
            ...err
          }
        }
      }else {
        res = {
          success: false,
          res: {
            errMsg: err
          }
        }
      }
      console.log(err)
      return false
    })
  }
  //未登录
  else {
    await mongo.connect("room")
    .then(db => db.findOne({
      origin: true,
      type: 'system',
    }, {
      projection: {
        message: 1
      }
    }))
    .then(data => !!data && data.message)
    .then(data => {
      if(data) {
        return mongo.connect("message")
        .then(db => db.find({
          _id: { $in: [ ...data ] },
          //这里
          create_time: { $lt: Date.now() }
        }, {
          sort: {
            create_time: -1
          },
          projection: {
            "content.text": 1,
            create_time: 1
          }
        }))
      }
      return Promise.reject({ errMsg: '服务器或数据库错误' })
    })
    .then(data => data.toArray())
    .then(data => {
      if(data.length) {
        const { create_time, content: { text } } = data[0]
        res = {
          success: true,
          res: {
            data: [
              {
                count: data.length,
                lastData: text,
                time: create_time,
              }
            ]
          }
        }
      }else {
        res = {
          success: true,
          res: {
            data: [
              {
                count: 0,
                lastDate: null,
                time: Date.now()
              }
            ]
          }
        }
      }
    })
    .catch(err => {
      if(err && err.errMsg) {
        res = {
          success: false,
          res: {
            ...err
          }
        }
      }else {
        res = {
          success: false,
          res: {
            errMsg: err
          }
        }
      }
      console.log(err)
      return false
    })
  }
  
  socket.emit("get", JSON.stringify(res))
}

module.exports = getMessageList