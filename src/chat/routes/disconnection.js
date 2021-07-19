const { disConnectServer } = require('../services')

const disconnection = socket => async (_) => {

  const { id } = socket

  try {
    await disConnectServer(socket, {}, {
      sid: id
    })
  }catch(err) {
    
  }

}
module.exports = disconnection