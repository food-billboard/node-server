const { verifySocketIoToken, RoomModel, notFound } = require("@src/utils")

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
  .then(data => !!data && data.doc)
  .then(notFound)
  .then(data => {
    const { members } = data
    const [ mine ] = members.filter(m => m.sid === id)
    const { user } = mine
    RoomModel.updateMany({
      "members.user": user,
      "members.status": "ONLINE"
    }, {
      $set: { "members.$.status": "OFFLINE" }
    })
  })
  .catch(err => {
    console.log(err)
  })
}
module.exports = disconnection