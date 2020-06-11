const { verifySocketIoToken, otherToken, UserModel, RoomModel, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const deleteMessage = socket => async(data) => {
  const { _id } = data
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token
  let res

  await UserModel.findOne({
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
      _id: ObjectId(_id),
      "members.user": userId
    }, {
      $set: { "members.$.message": [] }
    })
  })
  .then(_ => {
    res= {
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