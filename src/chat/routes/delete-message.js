const { verifySocketIoToken, MessageModel, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const deleteMessage = socket => async(data) => {
  const [, token] = verifySocketIoToken(data.token)
  const check = Params.bodyUnStatus(data, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item))
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

  const { id } = token
  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  })
  let res

  await MessageModel.updateMany({
    _id: {
      $in: _id
    },
  }, {
    $pull: { un_deleted: ObjectId(id) }
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