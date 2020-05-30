const { MongoDB, verifySocketIoToken, otherToken } = require("@src/utils")

const mongo = MongoDB()

const readMessage = socket => async (data) => {
  const { _id } = data
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token
  let errMsg
  let res
  let mine
  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1 
    }
  }))
  .then(data => {
    const { _id } = data
    mine = _id
  })
  .then(_ => mongo.connect("room"))
  .then(db => db.updateOne({
    _id: mongo.dealId(_id)
  }, {
    $set: { "member.$[message].message.$[user].readed": true }
  }, {
    arrayFilters: [
      {
        message: {
          $type: 'object'
        },
        "message.user": mine
      },
      {
        user: {
          $type: 'object'
        },
        "user.readed": false
      }
    ]
  }))
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