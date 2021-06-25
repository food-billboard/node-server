const { pick } = require('lodash')
const { quitRoom: quitRoomMethod } = require('../services')
const { errWrapper } = require('../utils')

//可以在这里广播通知所有聊天室内用户有用户离开
const quitRoom = socket => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await quitRoomMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
    // const { res: { data: roomId } } = res 
    // console.log(roomId)
    // socket.leave(roomId)
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("quit_room", res)
}

module.exports = quitRoom