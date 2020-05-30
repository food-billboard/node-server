const { MongoDB, verifySocketIoToken } = require("@src/utils")
const mongo = MongoDB()

const disconnection = socket => async (_) => {
  const { id } = socket
  const [, token] = verifySocketIoToken(socket)
  if(token) {
    const { mobile } = token
    await mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile)
    }, {
      projection: {
        _id: 1
      }
    }))
    .then(data => data && data._id)
    .then(id => {
      return mongo.connect("room")
      .then(db => db.updateMany({
        origin: true,
        "member.user": id,
        "member.status": 'online'
      }, {
        $set: { 
          "member.$.status": "offline",
          "member.$.sid": null
        }
      }))
    })
    .catch(err => {
      console.log(err)
      return false
    })
  }else {
    await mongo.connect("room")
    .then(db => db.findOneAndUpdate({
      origin: true,
      "member.sid": id
    }, {
      $pull: { "member.sid": id  }
    }, {
      projection: {
        _id: 1
      }
    }))
    .then(async (data) => {
      if(!data) return Promise.reject({errMsg: '断连失败', status: 500})
    })
    .catch(err => {
      console.log(err)
      return false
    })
  }
}
module.exports = disconnection