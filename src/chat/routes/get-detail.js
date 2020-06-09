const { verifySocketIoToken, otherToken, RoomModel, UserModel, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const getDetail = socket => async (data) => {
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { _id:roomId, startTime=Date.now(), pageSize=30, messageId } = data
  let res
  //已登录
  if(token) {
    const { mobile } = token

    messageList = UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound)
    .then(userId => {
      RoomModel.findOne({
        _id: ObjectId(roomId),
        members: { $elemMatch: { user: userId, status: 'ONLINE' } }
      })
      .select({
        members: 1
      })
      .populate({
        path: 'members.message',
        match: {
          $lt: startTime,
          ...(messageId ? { _id :ObjectId(messageId) } : {})
        },  
        options: {
          limit: pageSize,
        },
        select: {
          type: 1,
          content: 1,
          createdAt:1
        }
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(notFound)
      .then(data => {
        const { members } = data
        return {
          members: members.map(m => {
            const { _doc: { type, content: { text, video: { src:videoSrc }, image: { src: imageSrc }, audio }, ...nextData } } = m
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
              ...nextData,
              type,
              content: newContent
            }
          })
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
  //未登录
  else {

    await RoomModel.findOne({
      _id: ObjectId(roomId),
      origin: true,
      type: 'SYSTEM'
    })
    .select({
      message: 1
    })
    .populate({
      path: 'message',
      match: {
        $lt: startTime,
        ...(messageId ? { _id :ObjectId(messageId) } : {})
      },
      options: {
        limit: pageSize,
      },
      select: {
        type: 1,
        content: 1,
        createdAt:1
      }
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { message } = data
      return {
        members: message.map(m => {
          const { _doc: { type, content: { text, video: { src: videoSrc }, image: { src: imageSrc }, audio }, ...nextData } } = m
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
            ...nextData,
            type,
            content: newContent
          }
        })
      }
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