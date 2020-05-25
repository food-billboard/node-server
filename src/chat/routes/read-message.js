const { MongoDB } = require("@src/utils")

const mongo = MongoDB()

const readMessage = async (data) => {
  const { _id } = data
  let errMsg
  let res
  await mongo.connect("message")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $set: { readed: true }
    }))
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })

  if(errMsg) {
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  return res
}

module.exports = readMessage