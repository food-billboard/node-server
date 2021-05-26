const { verifySocketIoToken, RoomModel, UserModel, ROOM_TYPE, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

//可以在这里广播通知所有聊天室内用户有用户离开
const quitRoom = socket => async(data) => {
  const [, token] = verifySocketIoToken(data.token)
  const check = Params.bodyUnStatus(data, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check && !token) {
    socket.emit("delete", JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad request'
      }
    }))
    return
  }

  let res
  const { id } = token
  const userId = ObjectId(id)
  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  await RoomModel.findOneAndUpdate({
    "members.user": userId,
    _id,
    origin: false,
    type: ROOM_TYPE.GROUP_CHAT,
    create_user: { $ne: userId }
  }, {
    $pull: { members: { user: userId } }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(id => {
    if(!id) return Promise.reject({ errMsg: 'forbidden' })
    res = {
      success: true,
      res: id.toString()
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

  socket.emit("quit_room", JSON.stringify(res))
}

module.exports = quitRoom