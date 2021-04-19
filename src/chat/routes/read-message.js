const { verifySocketIoToken, UserModel, RoomModel, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const readMessage = socket => async (data) => {
  const check = Params.bodyUnStatus(data, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  const [, token] = verifySocketIoToken(data.token)
  if(check || !data) {
    socket.emit("put", JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad Request'
      }
    }))
    return
  }
  const [ _id ] = Param.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
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
      _id
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