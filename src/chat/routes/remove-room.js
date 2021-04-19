const { verifySocketIoToken, RoomModel, UserModel, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const removieRoom = socket => async(data) => {
  const [, token] = verifySocketIoToken(data.token)
  const check = Params.bodyUnStatus(data, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
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

  let res
  const { mobile } = token
  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(data => RoomModel.remove({
    "members.user": { $in: [ data ] },
    _id,
    origin: false,
    type: 'GROUP_CHAT',
    create_user: data
  }, {
    single: true
  }))
  .exec()
  .then(data => {
    console.log(data)
    if(data && data.nRemoved == 0) return Promise.reject({ errMsg: 'forbidden' })
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

  socket.emit("remove_room", JSON.stringify(res))
}

module.exports = removieRoom