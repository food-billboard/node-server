const { MongoDB } = require("@src/utils")
const mongo = MongoDB()

const getMessageList = async (query) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id } = data
    return  mongo.connect("message")
    .then(db => db.find({
      send_to: _id
    }, {
      projection: {
        user_info: 1,
        "content.text": 1,
        readed: 1,
        create_time: 1
      }
    }))
    .then(data => data.toArray())
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })
  
  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    const newData = data.map(d => {
      const { user_info, ...nextData } = d
      const { type, id }  = user_info
      return {
        ...nextData,
        user_info: {
          ...user_info,
          id: type === '__admin__' ? '__admin__' : id
        }
      }
    })
    res = {
      success: true,
      res: {
        data: newData
      }
    }
  }
  
  return res
}

module.exports = getMessageList