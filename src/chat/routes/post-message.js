const { pick } = require('lodash')
const { postMessage } = require('../services')
const { errWrapper } = require('../utils')

const sendMessage = socket => async (data) => {

  const { id } = socket

  let res 

  try {
    res = await postMessage(socket, data, {
      sid: id,
      ...pick(data, ["_id", 'type', 'content', 'point_to'])
    })
    // broadcastRoomMember()

    // const { message, roomData: { members } } = data

    // //记录不在线用户
    // const offline = members.filter(m => m.status !== 'online').map(m => m.user)
    // //对在线的直接进行广播
    // const res = {
    //   _id,
    //   type:messageType,
    //   content:messageContent,
    //   create_time
    // } = message
    // socket.to(roomId).emit("message", JSON.stringify(res))
    // //对在线不在房间的用户发送消息
    // offline.map(o => {
    //   const index = originRoomMember.findIndex((val) => o.equals(val.user) && !!val.sid)
    //   if(~index) return originRoomMember[index].sid
    //   return false
    // }).filter(sid => sid).forEach(sid => {
    //     socket.to(sid).emit("new", {
    //     ...res, 
    //     username: userInfo.username
    //   })
    // })

  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("post", res)
}

module.exports = sendMessage