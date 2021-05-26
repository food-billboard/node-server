const { Types: { ObjectId } } = require('mongoose')
const { 
  verifySocketIoToken, 
  UserModel, 
  MessageModel,
  RoomModel, 
  notFound, 
  formatISO, 
  formatMill, 
  NUM_DAY, 
  notFound,
  ROOM_TYPE,
  avatarGet
} = require("@src/utils")

function findMessage(userId) {
  return RoomModel.aggregate([
    {
      $match: {
        "members.user": {
          $in: [userId]
        }
      }
    },
    {
      $lookup: {
        from: 'images',
        localField: 'info.avatar',
        foreignField: '_id',
        as: 'info.avatar'
      }
    },
    {
      $unwind: {
        path: "$info.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'members.user',
        foreignField: '_id',
        as: 'members.user'
      }
    },
    {
      $look: {
        from: 'messages',
        localField: 'message',
        foreignField: '_id',
        as: 'message'
      }
    },
    {
      $project: {
        info: {
          avatar: "$info.avatar.src",
          description: "$info.description",
          name: "$info.name"
        },
        // message
      }
    }
  ])
}

const getMessageList = socket => async (data) => {
  const [, token] = verifySocketIoToken(data.token)
  
  let res
  //已登录
  if(token) {
    const { id } = token
    const mine = ObjectId(id)

    await RoomModel.find({
      "members.user": { $in: [ mine ] },
    })
    .select({
      // "members.message": 1,
      info: 1,
      type: 1
    })
    .sort({
      createdAt: -1
    })
    .populate({
      path: "members.user",
      select: {
        avatar: 1,
        username: 1,
      }
    })
    // .populate({
    //   path: 'members.message._id',
    //   select: {
    //     "content.text": 1,
    //     createdAt: 1,
    //     "user_info._id": 1
    //   },
    //   populate: {
    //     path: 'user_info._id',
    //     select: {
    //       avatar: 1,
    //       username: 1
    //     }
    //   }
    // })
    .exec()
    .then((data) => {
      return data.filter(d => {
        const { members } = d
        return members.some(mem => mem.user._id.equals(mine) && !!mem.message.length)
      })
      .map(d => {
        const { members, info: { _doc: { avatar, ...nextInfo } }, type, _id } = d
        const [ memberSelf ] = members.filter(mem => mem.user._id.equals(mine))
        const { message } = memberSelf

        let itemInfo = {}

        const [ nearlyMessage ] = message.sort((now, next) => {
          const { _id: { createdAt: nowTime } } = now
          const { _id: { createdAt: nextTime } } = next
          return formatMill(nextTime) - formatMill(nowTime)
        })

        //全部为已读消息时
        if(!message.some(mes => !mes.readed)) {
          const { _id: { createdAt } } = nearlyMessage
          if(type === 'CHAT') {
            //选取头像
            const index = members.findIndex(val => !val.user.equals(mine))
            const memberOther = members[index]
            const { user: { username, avatar } } = memberOther
            itemInfo = {
              name: username,
              avatar: avatar ? avatar.src : null,
              description: '暂时没有'
            }
          }else {
            itemInfo = {
              ...nextInfo,
              avatar: avatar ? avatar.src : null,
            }
          }

          return {
            _id,
            type,
            info: { ...itemInfo },
            message: {
              lastData: "暂无新消息",
              time: createdAt,
              count: 0
            }
          }

        }else {
          //有新消息
          const { _id: { content: { text }, createdAt, user_info: { avatar, username } } } = nearlyMessage

          if(type === 'CHAT') {
            itemInfo = {
              description: '暂时没有',
              name: username,
              avatar: userAvatar
            }
          }else {
            itemInfo = {
              ...nextInfo,
              avatar: avatar ? avatar.src : null,
            }
          }
          return {
            info: {
              ...itemInfo
            },
            type,
            _id,
            message: {
              lastData: text || '[媒体消息]',
              time: createdAt,
              count: message.filter(mes => !mes.readed).length
            }
          }
        }
      })
    })
    .then((data) => {
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
    await RoomModel.findOne({
      origin: true,
      type: ROOM_TYPE.SYSTEM
    })
    .select({
      message: 1,
      info: 1,
    })
    .populate({
      path: 'message',
      match: {
        createdAt: { $gte: formatISO(Date.now() - NUM_DAY(1)) }
      },
      select: {
        "content.text": 1,
        createdAt: 1
      }
    })
    .exec()
    .then(notFound)
    .then(data => {
      const { _id, info: { avatar, ...nextInfo }, message } = data
      const commonRes = {
        _id,
        type: ROOM_TYPE.SYSTEM,
        info: {
          ...nextInfo,
          avatar: avatarGet(avatar),
        }
      }
      if(message.length) {
        const [ nearlyMessage ] = message.sort((now, next) => {
          const { createdAt: nowTime } = now
          const { createdAt: nextTime } = next
          return formatMill(nextTime) - formatMill(nowTime)
        })
        const { createdAt, content: { text } } = nearlyMessage
        res = {
          success: true,
          res: {
            data: [
              {
                ...commonRes,
                message: {
                  count: message.length,
                  lastData: text,
                  time: createdAt
                }
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
                ...commonRes,
                message: {
                  count: 0,
                  lastDate: '暂无新消息',
                  time: Date.now()
                }
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