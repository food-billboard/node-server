const deleteMessage = require('./delete-message')
const getMessage = require('./get-message')
const readMessage = require('./read-message')
const sendMessage = require('./post-message')
const getDetail = require('./get-detail')
const { verifySocketIoToken } = require("@src/utils")

const userPool = new Map()

// get 
// put params: { id: 消息id }
// postdata: { 
  // content: 消息内容,
  // type: 消息类型(image | audio | text | video),
  // id: 用户id,
// }
// delete params: { id: 消息id }

//对用户发送的媒体资源进行单独存储（对文件命名添加特殊标识前缀，在静态资源访问时做判断）
//对存在访问权限的文件的用户访问做权限判断。

module.exports = (socket) => {
  //中间件验证用户登录状态
  //删除消息
  socket.on("delete", async (data) => {
    const response = await deleteMessage(data)
    socket.emit("delete", response)
  })
  //获取消息列表
  socket.on("get", (data) => {
    const response = await getMessage(data)
    socket.emit("get", response)
  })
  //阅读消息
  socket.on("put", (data) => {
    const response = await readMessage(data)
    socket.emit("delete", response)
  })
  //发送消息
  socket.on("post", async (data) => {
    //将完整消息存入数据库
    const response = await sendMessage(data)
    //将消息发送给接收方(传输的是简易信息，单纯告知有新消息以及消息类型，发送方)
	if(true/*接收方在房间*/) {
	  socket.emit("message", {
		type: '消息类型',
        content: {//改为单个内容字符串
		  text: '',
		  video: '',
		  image: ''
		},
        readed: false,
        create_time:'创建时间从上面拿'
	  })
	}else {
	  socket.emit("get", [
	  {
		user_info: {
		  type: '类型',
		  id: '用户id__admin__'
		},
		content: {
		  text: '文字内容如果为视频或图片内容的话则显示空'
		},
        readed: false,
        create_time: '消息发送时间'  
	  }
	  ])
	}
  })
  //用于检验前端是否接收到该消息
  socket.on("message", async(data) => {
	//成功接收到消息
	if(true) {
	  //将响应状态发送给消息发送方
	  socket.emit("post", {success: true})
	}else {	//告知发送方消息发送失败
		
	}
  })
  //消息详情
  socket.on("detail", async(data) => {
    //可以让用户在进入某个详情页面时，进入某个room，在有新消息时判断是否为该room消息，有则发送emit
    //用于告知服务器接收与某一用户聊天的详细信息（需要前端告知是否需要继续发送详细信息）
	
	//用户想获取详情，进入房间(记录进入时间，在下次获取相关历史记录时对进入房间后的数据的记录不做处理)  ----前端可将数据存储为全局，并设置一定时间内有效
	//根据返回的参数进行选择性的获取数据
    const response = await getDetail(data)
    socket.emit("detail", response)
  })
}

/**
 * io.emit('get') //获取消息列表 第一次加载
 * io.on('get', (data) => {
 *  console.log('这里就是接收到的消息列表')
 * })
 * io.emit('delete', {_id})//这里是要去删除某一条消息
 * io.on('delete', (data) => {
 *  console.log('这里用于告知客户端服务端已经把消息删掉了')
 * }})
 * io.emit('put', {_id})//这里是要去阅读某一条消息
 * io.on('put', (data) => {
 *  console.log('这里用于告知客户端服务端已经将消息设置为已读了')
 * })
 * io.emit('post', {data})//这里用来向其他用户发送消息
 * io.on('post', (data) => {
 *  console.log('这里用于告知客户端消息发送成功了')
 * })
 * io.on('message', (data) => {
 *  console.log('在这里获取到他人发送的消息')
 * })
 */
 
//  post get delete put message complete
 
//  //发送消息
//  client1-emit-post -> server-on-post -> server-emit-message -> client2-on-message -> client2-emit-message -> server-on-message -> server-emit-post -> client1-on-post -> client1-emit-complete
// 										这里判断client2是否在房间
// 										不在用server-emit-get -> client2-on-get -> client2-on-complete
// //阅读消息
// client1-emit-read -> server-on-read -> server-emit-read -> client1-on-read -> client1-emit-complete

// //删除消息
// client1-emit-delete -> server-on-delete -> server-emit-delete -> client1-on-delete -> client1-emit-complete

// //获取消息
// client1-emit-get -> server-on-get -> server-emit-get -> client1-on-get -> client1-emit-complete

// //接收消息
// client1-on-message -> client1-emit-message -> server-on-message -> server-emit-post -> client2-on-post -> client2-emit-complete