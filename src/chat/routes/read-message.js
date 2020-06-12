const { verifySocketIoToken, otherToken, UserModel, RoomModel } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const readMessage = socket => async (data) => {
  const { _id } = data
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token
  let errMsg
  let res

  await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(userId => {
    return RoomModel.updateOne({
      _id: ObjectId(_id),
    }, {
      $set: { "members.$[message].message.$[user].readed": true }
    }, {
      arrayFilters: [
        {
          message: {
            $type: 3
          },
          "message.user": userId
        },
        {
          user: {
            $type: 3
          },
          "user.readed": false
        }
      ]
    })
  })
  .then(data => {
    console.log(data)
  })
  .catch(err => {
    console.log(err)
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

  socket.emit("put", JSON.stringify(res))
}

module.exports = readMessage