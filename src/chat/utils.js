const { verifySocketIoToken, UserModel, RoomModel } = require("@src/utils")

const connection = async (socket, next) => {
  const { id } = socket
  const [, token] = verifySocketIoToken(socket)
  let user = null
  if(token) {
    const { mobile } = token
    user = await UserModel.findOne({
      mobile: ~~mobile
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(userId => {
      RoomModel.updateOne({
        origin: true,
        "members.user": userId
      }, {
        $set: { "members.$sid": id }
      })
    })

    // user = await mongo.connect("user")
    // .then(db => db.findOne({
    //   mobile: Number(mobile),
    // }, {
    //   projection: {
    //     _id: 1,
    //   }
    // }))
    // .then(data => data && data._id)
    // .then(data => {
    //   return mongo.connect("room")
    //   .then(db => db.updateOne({
    //     origin: true,
    //     "member.user": data
    //   }, {
    //     $set: { "member.$.sid": id }
    //   }))
    // })
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