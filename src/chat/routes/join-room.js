const { pick } = require('lodash')
const { joinRoom: joinRoomMethod, leaveRoom: leaveRoomMethod } = require('../services')
const { errWrapper } = require('../utils')

//加入房间
const joinRoom = socket => async (data) => {

  const { id } = socket

  let res 

  try {
    res = await joinRoomMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
    const { res: { data: roomId } } = JSON.parse(res) 
    socket.join(roomId)
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("join", res)
}

//离开房间
const leaveRoom = socket => async (data) => {

  const { id } = socket

  let res 

  try {
    res = await leaveRoomMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
    const { res: { data: roomId } } = JSON.parse(res)  
    socket.leave(roomId)
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("leave", res)
}

module.exports = {
  leaveRoom,
  joinRoom
}