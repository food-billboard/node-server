const { connectServer } = require('../services')
const { isTempUserExists, errWrapper } = require('../utils')


const connect = socket => async (data) => {

  const temp_user_id = isTempUserExists(data)
  const { id } = socket

  let res 

  try {
    res = await connectServer(socket, data, {
      temp_user_id,
      sid: id
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit('connect_user', res)

}

module.exports = connect