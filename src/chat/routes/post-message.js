const { MongoDB } = require("@src/utils")

const mongo = MongoDB()

const TEMPLATE_MESSAGE = {
  user_info: {
    type: '',
    id: ''
  },
  send_to: '',
  type: '',
  content: {
    text: '',
    video: '',
    image: ''
  },
  readed:false,
  create_time: Date.now()
}

const sendMessage = (data) => {
  // let res
  // let errMsg
  // let templateMessage = { ...TEMPLATE_MESSAGE }
  // const { body: {  
  //   content,
  //   type,
  //   _id:send_to,
  // } } = data
  // const [, token] = verifyTokenToData(ctx)
  // const { mobile } = token

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id } = data
    const { content:template } = templateMessage
    let newContent = { ...template }
    switch(type) {
      case "image":
        newContent = {
          ...newContent,
          image: content
        }
        break
      case "video":
        newContent = {
          ...newContent,
          video: content
        }
        break
      case "audio":
        newContent = {
          ...newContent,
          autio: content
        }
        break
      case "text":
      default:
        newContent = {
          ...newContent,
          text: content.toString()
        }
        break 
    }
    templateMessage = {
      ...templateMessage,
      user_info: {
        type: 'user',
        id: _id,
      },
      send_to,
      content: { ...newContent },
      readed: false,
      create_time: Date.now()
    }
  })
  .then(_ => mongo.connect("message"))
  .then(db => db.insertOne({
    ...templateMessage
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