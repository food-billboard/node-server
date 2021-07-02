const { pick } = require('lodash')
const { inviteFriendList: inviteFriendListMethod } = require('../services')
const { errWrapper } = require('../utils')

const inviteFriendList = socket => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await inviteFriendListMethod(socket, data, {
      sid: id,
      ...pick(data, ["currPage", "pageSize"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("invite_friend_list", res)
}

module.exports = inviteFriendList