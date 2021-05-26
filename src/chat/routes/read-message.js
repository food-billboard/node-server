const { verifySocketIoToken, MessageModel, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const readMessage = socket => async (data) => {
  const check = Params.bodyUnStatus(data, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item))
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
      data => data.split(',').every(item => ObjectId(item))
    ]
  })
  const { id } = token
  let errMsg
  let res

  await MessageModel.updateMany({
    _id: {
      $in: _id
    },
  }, {
    $addToSet: {
      readed: ObjectId(id)
    }
  })

  // await RoomModel.updateOne({
  //   _id
  // }, {
  //   $set: { "members.$[message].message.$[user].readed": true }
  // }, {
  //   arrayFilters: [
  //     {
  //       message: {
  //         $type: 3
  //       },
  //       "message.user": ObjectId(id)
  //     },
  //     {
  //       user: {
  //         $type: 3
  //       },
  //       "user.readed": false
  //     }
  //   ]
  // })
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