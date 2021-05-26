const { verifySocketIoToken, RoomModel, ROOM_TYPE, Params, parseData } = require("@src/utils")
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
  const { id } = token
  const userId = ObjectId(id)
  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  await RoomModel.findOne({
    _id,
  })
  .select({
    type: 1,
    create_user: 1,
    members: 1,
    delete_users: 1
  })
  .exec()
  .then(parseData)
  .then(data => {
    const { members, create_user, type, delete_users } = data 
    if(type === ROOM_TYPE.SYSTEM || create_user !== id ||!members.some(item => item.user === id)) return Promise.reject({
      errMsg: 'forbidden'
    })
    if(type === ROOM_TYPE.CHAT && delete_users.length != 2) {
      return RoomModel.updateOne({
        _id,
        origin: false,
        type: ROOM_TYPE.CHAT,
      }, {
        $addToSet: {
          delete_users: userId
        }
      })
    }else {
      return RoomModel.remove({
        _id,
        origin: false,
        ...(type === ROOM_TYPE.CHAT ? {} : { create_user: data }),
      }, {
        single: true
      })
    }
  })
  .exec()
  .then(_ => {
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