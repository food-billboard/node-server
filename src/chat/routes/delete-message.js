const { deleteMessage: deleteMessagePost } = require('../services')

const deleteMessage = (socket) => async (data) => {

  let res 

  try {
    res = await deleteMessagePost(socket, data, {
      _id: data._id,
      type: data.type
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit('connect_user', res)

}

module.exports = deleteMessage