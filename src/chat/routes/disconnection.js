const { RoomModel, ROOM_TYPE, ROOM_USER_NET_STATUS, parseData } = require("@src/utils")

const disconnection = socket => async (_) => {
  const { id } = socket

  await RoomModel.findOneAndUpdate({
    origin: true,
    type: ROOM_TYPE.SYSTEM,
    "members.sid": id
  }, {
    $set: {
      "members.$.status": ROOM_USER_NET_STATUS.OFFLINE,
      "members.$.sid": null
    }
  })
  .select({
    "members.user": 1,
    "members.sid": 1
  })
  .exec()
  .then(parseData)
  .then(data => {
    if(!data) return
    const { members } = data
    const [ mine ] = members.filter(m => m.sid === id)
    const { user } = mine
    return RoomModel.updateMany({
      "members.user": user,
      "members.status": ROOM_USER_NET_STATUS.ONLINE
    }, {
      $set: { "members.$.status": ROOM_USER_NET_STATUS.OFFLINE }
    })
  })
  .catch(err => {
    console.log(err)
  })
}
module.exports = disconnection