const { MongoDB } = require("@src/utils")

const mongo = MongoDB()

const deleteMessage = async(data) => {
  const { _id } = data
  let res
  let errMsg
  await mongo.connect("message")
  .then(db => db.deleteOne({
    _id: mongo.dealId(_id)
  }))
  .catch(err => {
    errMsg = err
    console.log(err)
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

module.exports = deleteMessage