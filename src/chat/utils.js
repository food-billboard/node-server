const { MongoDB } = require("@src/utils")
const mongo = MongoDB()

const connection = async (socket, next) => {
  const { id } = socket
  await mongo.connect("room")
  .then(db => db.findOneAndUpdate({
    origin: true,
    "member.sid": { $nin: [id] },
  }, {
    $push: { member: { sid: id, create_time: Date.now(), modified_time: Date.now() } }
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(async (data) => {
    //加入最外层房间
    if(data && data.value) {
      const { value: { _id } } = data
      await socket.join(_id.toString())
      return true
    }
    return Promise.reject({status: 403, errMsg: '请求过快'})
  })
  .catch(err => {
    console.log(err)
    return false
  })

  await next()

}

module.exports = {
  connection
}