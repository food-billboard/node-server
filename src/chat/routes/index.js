const deleteMessage = require('./delete-message')
const getMessage = require('./get-message')
const readMessage = require('./read-message')
const sendMessage = require('./post-message')
const getDetail = require('./get-detail')
const disconnection = require('./disconnection')
const { joinRoom, leaveRoom } = require('./join-room')
const removeRoom = require('./remove-room')
const quitRoom = require('./quit-room')
const { middlewareVerifyTokenForSocketIo } = require("@src/utils")

//对用户发送的媒体资源进行单独存储（对文件命名添加特殊标识前缀，在静态资源访问时做判断）
//对存在访问权限的文件的用户访问做权限判断。

module.exports = socket => {
  socket
  .use(middlewareVerifyTokenForSocketIo(socket))
  //删除消息
  .on("delete", deleteMessage(socket))
  //获取消息列表
  .on("get", getMessage(socket))
  //阅读消息
  .on("put", readMessage(socket))
  //发送消息
  .on("post", sendMessage(socket))
  //用于获取信息详情
  .on("message", getDetail(socket))
  //加入聊天室
  .on("join", joinRoom(socket))
  //离开聊天室
  .on('leave', leaveRoom(socket))
  //断开连接
  .on("disconnecting", disconnection(socket))
  //删除当前聊天室
  .on('remove_room', removeRoom(socket))
  //退出聊天室
  .on('quit_room', quitRoom(socket))
}