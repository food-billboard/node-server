const { verifySocketIoToken, UserModel, RoomModel, notFound } = require("@src/utils")

const connection = async (socket, next) => {
  const { id } = socket
  const [, token] = verifySocketIoToken(socket)
  let user = null
  if(token) {
    const { mobile } = token
    user = await UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound)
    .then(userId => {
      RoomModel.updateOne({
        origin: true,
        "members.user": userId
      }, {
        $set: { "members.$sid": id }
      })
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