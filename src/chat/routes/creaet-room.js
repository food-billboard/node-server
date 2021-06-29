const { pick } = require('lodash')
const { createRoom: createRoomMethod } = require('../services')
const { errWrapper } = require('../utils')

const createRoom = socket => async(data) => {

  const { id } = socket

  let res 

  try {
    res = await createRoomMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id", "type", "members"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("create_room", res)
}

module.exports = createRoom