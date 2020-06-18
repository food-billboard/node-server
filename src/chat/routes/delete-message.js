const { verifySocketIoToken, UserModel, RoomModel, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const deleteMessage = socket => async(data) => {
  const [, token] = verifySocketIoToken(data.token)
  const check = Params.bodyUnStatus(data, {
    name: '_id',
    type: [ 'isMongoId' ]
  })
  if(check && !token) {
    socket.emit("delete", JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad request'
      }
    }))
    return
  }

  const { mobile } = token
  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
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
    return RoomModel.updateOne({
      _id,
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