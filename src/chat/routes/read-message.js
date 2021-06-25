const { pick } = require('lodash')
const { readMessage: readMessageMethod } = require('../services')
const { errWrapper } = require('../utils')

const readMessage = socket => async (data) => {

  const { id } = socket

  let res 

  try {
    res = await readMessageMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id", "type"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("put", res)
}

module.exports = readMessage