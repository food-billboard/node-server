const { MongoDB, otherToken, verifySocketIoToken } = require("@src/utils")

const mongo = MongoDB()

const deleteMessage = socket => async(data) => {
  const { _id } = data
  const [, token] = verifySocketIoToken(data)
  const { mobile } = token
  let res
  let errMsg
  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    _id: 1
  }))
  .then(data => {
    const { _id:userId } = data
    mongo.connect("room")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id),
      "member.user": userId,
      origin: false,
    }, {
      $set: { "member.$.message": [] }
    }))
  })
  .catch(err => {
    errMsg = err
    return false
  })

  if(errMsg) {
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  socket.emit("delete", JSON.stringify(res))
}

module.exports = deleteMessage