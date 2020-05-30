const { MongoDB, verifySocketIoToken } = require("@src/utils")
const mongo = MongoDB()

const connection = async (socket, next) => {
  const { id } = socket
  const [, token] = verifySocketIoToken(socket)
  let user = null
  if(token) {
    const { mobile } = token
    user = await mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile),
    }, {
      projection: {
        _id: 1,
      }
    }))
    .then(data => data && data._id)
    .catch(err => {
      console.log(err)
      return null
    })
  }

  await mongo.connect("room")
  .then(db => db.findOneAndUpdate({
    origin: true,
    "member.sid": { $nin: [id] },
    ...(user ? {"member.user": { $nin: [user] }} : {})
  }, {
    $push: { member: { user, sid: id, create_time: Date.now(), modified_time: Date.now() } }
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
    return Promise.reject({status: 403, errMsg: '请求过快或同账号多次请求'})
  })
  .catch(err => {
    console.log(err)
    return false
  })

  await next()

}

let timer 
const pollingClean = () => {
  clearInterval(timer)
  timer = setInterval(() => {
    mongo.connect("room")
    .then(db => db.deleteMany({
      
    }))
  }, 24 * 60 * 60 * 1000)
}

module.exports = {
  connection,
}