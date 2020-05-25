const deleteMessage = require('./delete-message')
const getMessage = require('./get-message')
const readMessage = require('./read-message')
const sendMessage = require('./post-message')
const getDetail = require('./get-detail')
const { verifySocketIoToken } = require("@src/utils")

const userPool = new Map()

module.exports = (socket) => {
  socket.on("logon", async(data) => {

  })
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
    //将响应状态发送给消息发送方
    socket.emit("post", response)
    //将消息发送给接收方(传输的是简易信息，单纯告知有新消息以及消息类型，发送方)
    socket.emit("message", {data: '消息内容'})
  })
  //接收新消息
  socket.on("message", async(data) => {
    //用于检验前端是否接收到该消息
  })
  //消息详情
  socket.on("detail", async(data) => {
    //可以让用户在进入某个详情页面时，进入某个room，在有新消息时判断是否为该room消息，有则发送emit
    //用于告知服务器接收与某一用户聊天的详细信息（需要前端告知是否需要继续发送详细信息）
    socket.emit("detail", {/*相关数据*/})
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