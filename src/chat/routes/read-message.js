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
    mobile: ~~mobile
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(userId => {
    RoomModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $set: { "member.$[message].message.$[user].readed": true }
    }, {
      arrayFilters: [
        {
          message: {
            $type: 'object'
          },
          "message.user": userId
        },
        {
          user: {
            $type: 'object'
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



  // await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: Number(mobile)
  // }, {
  //   projection: {
  //     _id: 1 
  //   }
  // }))
  // .then(data => {
  //   const { _id } = data
  //   mine = _id
  // })
  // .then(_ => mongo.connect("room"))
  // .then(db => db.updateOne({
  //   _id: mongo.dealId(_id)
  // }, {
  //   $set: { "member.$[message].message.$[user].readed": true }
  // }, {
  //   arrayFilters: [
  //     {
  //       message: {
  //         $type: 'object'
  //       },
  //       "message.user": mine
  //     },
  //     {
  //       user: {
  //         $type: 'object'
  //       },
  //       "user.readed": false
  //     }
  //   ]
  // }))
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

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