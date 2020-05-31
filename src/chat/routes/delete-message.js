const { MongoDB, verifySocketIoToken, otherToken } = require("@src/utils")

const mongo = MongoDB()

const deleteMessage = socket => async(data) => {
  const { _id } = data
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token
  let res
  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    _id: 1
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("room")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id),
      "member.user": userId,
    }, {
      $set: { "member.$.message": [] }
    }))
  })
  .then(data => {
    if(data && data.result && !data.result.nModified) return Promise.reject({ errMsg: '房间不存在或无内容可删除' })
    res = {
      success: true,
      res: null
    }
  })
  .catch(err => {
    console.log(err)
    if(err && err.errMsg) {
      res = {
        success: false,
        res: {
          ...err
        }
      }
    }else {
      res = {
        success: false,
        res: {
          errMsg: err
        }
      }
    }
    return false
  })

  socket.emit("delete", JSON.stringify(res))
}

module.exports = deleteMessage