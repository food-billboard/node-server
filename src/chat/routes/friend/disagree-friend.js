const { pick } = require('lodash')
const { disagreeFriend: disagreeFriendMethod } = require('../services')
const { errWrapper } = require('../utils')

const disagreeFriend = socket => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await disagreeFriendMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("disagree_friend", res)
}

module.exports = disagreeFriend