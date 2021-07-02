const { pick } = require('lodash')
const { inviteFriend: inviteFriendMethod } = require('../services')
const { errWrapper } = require('../utils')

const inviteFriend = socket => async(data) => {

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

  socket.emit("invite_friend", res)
}

module.exports = inviteFriend