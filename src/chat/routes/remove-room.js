const { pick } = require('lodash')
const { deleteRoom } = require('../services')
const { errWrapper } = require('../utils')

const removeRoom = socket => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await deleteRoom(socket, data, {
      sid: id,
      ...pick(data, ["_id"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("remove_room", res)
}

module.exports = removeRoom