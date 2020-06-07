const { verifySocketIoToken, RoomModel } = require("@src/utils")
const mongo = MongoDB()

const disconnection = socket => async (_) => {
  const { id } = socket

  await RoomModel.findOneAndUpdate({
    origin: true,
    type: 'SYSTEM',
    "members.sid": id
  }, {
    $set: {
      "members.$.status": "OFFLINE",
      "members.$.sid": null
    }
  })
  .select({
    "members.user": 1,
    "members.sid": 1
  })
  .exec()
  .then(data => {
    if(data && data.value) {
      const { value: { member } } = data
      const [ mine ] = member.filter(m => m.sid === id)
      const { user } = mine
      RoomModel.updateMany({
        "members.user": user,
        "members.status": "ONLINE"
      }, {
        $set: { "members.$.status": "OFFLINE" }
      })
    }
  })
  .catch(err => {
    console.log(err)
  })

  // await mongo.connect("room")
  // .then(db => db.findOneAndUpdate({
  //   origin: true,
  //   type: 'system',
  //   "member.sid": id
  // }, {
  //   $set: { 
  //     "member.$.status": "offline",
  //     "member.$.sid": null
  //   }
  // }, {
  //   projection: {
  //     "member.user": 1,
  //     "member.sid": 1
  //   }
  // }))
  // .then(data => {
  //   if(data && data.value) {
  //     const { value: { member } } = data
  //     const [ mine ] = member.filter(m => m.sid === id)
  //     const { user } = mine
  //     mongo.connect("room")
  //     .then(db => db.updateMany({
  //       "member.user": user,
  //       "member.status": 'online'
  //     }, {
  //       $set: { "member.$.status": 'offline' }
  //     }))
  //   }
    
  // })
  // .catch(err => {
  //   console.log(err)
  // })
}
module.exports = disconnection