const { verifySocketIoToken, otherToken, UserModel, RoomModel } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const mongo = MongoDB()

const deleteMessage = socket => async(data) => {
  const { _id } = data
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token
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

  // await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: Number(mobile)
  // }, {
  //   _id: 1
  // }))
  // .then(data => {
  //   const { _id:userId } = data
  //   return mongo.connect("room")
  //   .then(db => db.updateOne({
  //     _id: mongo.dealId(_id),
  //     "member.user": userId,
  //   }, {
  //     $set: { "member.$.message": [] }
  //   }))
  // })
  // .then(data => {
  //   if(data && data.result && !data.result.nModified) return Promise.reject({ errMsg: '房间不存在或无内容可删除' })
  //   res = {
  //     success: true,
  //     res: null
  //   }
  // })
  // .catch(err => {
  //   console.log(err)
  //   if(err && err.errMsg) {
  //     res = {
  //       success: false,
  //       res: {
  //         ...err
  //       }
  //     }
  //   }else {
  //     res = {
  //       success: false,
  //       res: {
  //         errMsg: err
  //       }
  //     }
  //   }
  //   return false
  // })

  socket.emit("delete", JSON.stringify(res))
}

module.exports = deleteMessage