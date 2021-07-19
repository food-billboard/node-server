const { pick } = require('lodash')
const { getRoomList: getRoomListMethod } = require('../services')
const { errWrapper } = require('../utils')

const getRoomList = socket => async (data) => {

  const { id } = socket

  let res 
  try {
    res = await getRoomListMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id", "currPage", "pageSize", 'type', 'origin', 'create_user', 'content', 'members'])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("room", res)
}

module.exports = getRoomList