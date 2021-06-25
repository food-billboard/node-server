const { pick } = require('lodash')
const { getMessageList: getMessageListMethod } = require('../services')
const { errWrapper } = require('../utils')

const getMessageList = socket => async (data) => {

  const { id } = socket

  let res 

  try {
    res = await getMessageListMethod(socket, data, {
      sid: id,
      ...pick(data, ["_id", "currPage", "pageSize"])
    })
  }catch(err) {
    res = JSON.stringify(errWrapper(err))
  }

  socket.emit("get", res)
}

module.exports = getMessageList