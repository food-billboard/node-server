const { pick } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')
const { inviteFriend: inviteFriendMethod } = require('../../services')
const { errWrapper, getSocket, findFriends } = require('../../utils')

/** 
 * emit响应 如果有响应值则说明是主动好友申请
 * 否则是提醒用户存在新申请
*/

const inviteFriend = (socket, io) => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await inviteFriendMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  await broadcastMember(io, socket, data)

  socket.emit("invite_friend", res)
}

//广播通知
const broadcastMember = async (io, socket, data) => {
  const { _id } = data
  const result = await findFriends(_id)
  try {
    const [ { sid } ] = result
    const friendSocket = getSocket(io, sid)
    if(friendSocket) {
      friendSocket.emit('invite_friend')
    }
  }catch(err) {
    console.log(err)
  }
}

module.exports = inviteFriend