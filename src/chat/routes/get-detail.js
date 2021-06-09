const { pick } = require('lodash')
const { getMessageDetail } = require('../services')

const getDetail = socket => async (data) => {

  const { id } = socket

  let res 

  try {
    res = await getMessageDetail(socket, data, {
      sid: id,
      ...pick(data, [ "_id", "currPage", "pageSize", "start" ])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit('message', res)
  
}

module.exports = getDetail