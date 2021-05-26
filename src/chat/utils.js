require('module-alias/register')
const { Types: { ObjectId } } = require('mongoose')
const { verifySocketIoToken, RoomModel } = require("@src/utils")

const connection = async (socket, next) => {
  const { id } = socket
  const [, token] = verifySocketIoToken(socket)
  if(token) {
    const { id: _id } = token
    await RoomModel.updateOne({
      origin: true,
      "members.user": ObjectId(id)
    }, {
      $set: { "members.$.sid": id }
    })
    .catch(err => {
      console.log(err)
      return null
    })
  }

  socket.join(id)

  await next()

}

module.exports = {
  connection,
}