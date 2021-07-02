const { pick } = require('lodash')
const { agreeFriend: agreeFriendMethod } = require('../services')
const { errWrapper } = require('../utils')

const agreeFriend = socket => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await agreeFriendMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("agree_friend", res)
}

module.exports = agreeFriend