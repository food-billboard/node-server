const { MongoDB } = require("@src/utils")
const mongo = MongoDB()

const disconnection = socket => async (_) => {
  const { id } = socket
  await mongo.connect("room")
  .then(db => db.findOneAndUpdate({
    origin: true,
    "member.sid": id
  }, {
    $pull: { member: { sid: id } }
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(async (data) => {
    if(!data) return Promise.reject({errMsg: '断连失败', status: 500})
    return true 
  })
  .catch(err => {
    console.log(err)
    return false
  })
}
module.exports = disconnection