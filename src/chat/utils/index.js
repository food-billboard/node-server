require('module-alias/register')
const { nanoid } = require('nanoid')
const { request } = require('./request')

const isTempUserExists = (data) => {
  const { temp_user_id } = data
  if(typeof temp_user_id === 'string' && !!temp_user_id) return temp_user_id
  return nanoid()
}

const errWrapper = (error) => {
  const { errMsg } = error
  return {
    success: false,
    res: {
      errMsg,
      origin: error
    }
  } 
}

const connection = async (socket, next) => {
  const { id } = socket

  socket.join(id)

  await next()

}

module.exports = {
  connection,
  request,
  isTempUserExists,
  errWrapper
}