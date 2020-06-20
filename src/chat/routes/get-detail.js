const { verifySocketIoToken, RoomModel, UserModel, notFound, Params, formatISO } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const getDetail = socket => async (data) => {
  const [, token] = verifySocketIoToken(data.token)
  const check = Params.bodyUnStatsu(data, {
    name: '_id',
    type: [ 'isMongoId' ]
  }, {
    name: 'messageId',
    validator: [
      data => !!data ? ObjectId.isValid(data) : true
    ]
  })
  if(check && !token) {
    socket.emit("message", JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad request'
      }
    }))
    return
  }
  const [ roomId, startTime, pageSize, messageId ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'startTime',
    _default: formatISO(Date.now()),
    sanitizers: [
      data => formatISO(data),
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'messageId',
    sanitizers: [
      data => !!data ? ObjectId(data) : data
    ]
  })
  let res
  //已登录
  if(token) {
    const { mobile } = token

    messageList = await UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound)
    .then(userId => {
      return RoomModel.findOne({
        _id: roomId,
        "members.user": userId,
        "members.status": "ONLINE"
      })
      .select({
        "members.$": 1
      })
      .populate({
        path: 'members.message._id',
        match: {
          createdAt: { $lt: startTime },
          ...(messageId ? { _id : messageId } : {})
        },  
        options: {
          ...(pageSize >= 0 ? { limit: pageSize } : {})
        },
        select: {
          type: 1,
          content: 1,
          createdAt:1,
          "user_info._id": 1
        }
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(notFound)
      .then(data => {
        const { members } = data
        const [member] = members
        const { message } = member
        console.log(message)
        return message.map(m => {
          const { _doc: { _id: { type, content: { text, video: { src:videoSrc }={}, image: { src: imageSrc }={}, audio }={}, createdAt, user_info: { _id: userId }={}, _id } } } = m
          let newContent
          switch(type) {
            case "IMAGE": 
              newContent = imageSrc
              break
            case "VIDEO":
              newContent = videoSrc
              break
            case "AUDIO":
              newContent = audio
              break
            case "TEXT":
            default:
              newContent = text
              break
          }
          return {
            _id,
            origin: userId,
            createdAt,
            type,
            content: newContent
          }
        })
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
      console.log(err)
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
      return false
    })
  }
  //未登录
  else {

    await RoomModel.findOne({
      _id: roomId,
      origin: true,
      type: 'SYSTEM'
    })
    .select({
      message: 1
    })
    .populate({
      path: 'message',
      match: {
        createdAt: { $lt: startTime },
        ...(messageId ? { _id : messageId } : {})
      },
      options: {
        ...(pageSize >= 0 ? { limit: pageSize } : {})
      },
      select: {
        type: 1,
        content: 1,
        createdAt:1,
        "user_info._id": 1
      }
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { message } = data
      return message.map(m => {
        const { _doc: { type, content: { text, video: { src: videoSrc }, image: { src: imageSrc }, audio }, createdAt, user_info: { _id: userId }, _id } } = m
        let newContent
        switch(type) {
          case "IMAGE": 
            newContent = imageSrc
            break
          case "VIDEO":
            newContent = videoSrc
            break
          case "AUDIO":
            newContent = audio
            break
          case "TEXT":
          default:
            newContent = text
            break
        }
        return {
          origin: userId,
          _id,
          createdAt,
          type,
          content: newContent
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
      console.log(err)
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
      return false
    })
  }

  socket.emit("message", JSON.stringify(res))
  
}

module.exports = getDetail