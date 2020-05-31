const { MongoDB, verifySocketIoToken } = require("@src/utils")
const mongo = MongoDB()

const disconnection = socket => async (_) => {
  const { id } = socket

  await mongo.connect("room")
  .then(db => db.findOneAndUpdate({
    origin: true,
    type: 'system',
    "member.sid": id
  }, {
    $set: { 
      "member.$.status": "offline",
      "member.$.sid": null
    }
  }, {
    projection: {
      "member.user": 1,
      "member.sid": 1
    }
  }))
  .then(data => {
    if(data && data.value) {
      const { value: { member } } = data
      const [ mine ] = member.filter(m => m.sid === id)
      const { user } = mine
      mongo.connect("room")
      .then(db => db.updateMany({
        "member.user": user,
        "member.status": 'online'
      }, {
        $set: { "member.$.status": 'offline' }
      }))
    }
    
  })
  .catch(err => {
    console.log(err)
  })
}
module.exports = disconnection