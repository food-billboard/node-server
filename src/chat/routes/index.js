const deleteMessage = require('./delete-message')
const getMessage = require('./get-message')
const readMessage = require('./read-message')
const sendMessage = require('./post-message')
const getDetail = require('./get-detail')
const disconnection = require('./disconnection')
const { joinRoom, leaveRoom } = require('./join-room')
const removeRoom = require('./remove-room')
const quitRoom = require('./quit-room')
const connect = require('./connect')
const getRoom = require('./get-room')
const createRoom = require('./create-room')
const inviteFriendList = require('./friend/invite-list')
const inviteFriend = require('./friend/invite-friend')
const agreeFriend = require('./friend/agree-friend')
const disagreeFriend = require('./friend/disagree-friend')
const { middlewareVerifyTokenForSocketIo } = require("@src/utils")

module.exports = (io) => (socket) => {
  socket
  // .use(middlewareVerifyTokenForSocketIo(socket))
  //删除消息
  .on("delete", deleteMessage(socket, io))
  //获取消息列表
  .on("get", getMessage(socket, io))
  //阅读消息
  .on("put", readMessage(socket, io))
  //发送消息
  .on("post", sendMessage(socket, io))
  //用于获取信息详情
  .on("message", getDetail(socket, io))
  //创建聊天室
  .on('create_room', createRoom(socket, io))
  //加入聊天室
  .on("join", joinRoom(socket, io))
  //离开聊天室
  .on('leave', leaveRoom(socket, io))
  //断开连接
  .on("disconnecting", disconnection(socket, io))
  //删除当前聊天室
  .on('remove_room', removeRoom(socket, io))
  //退出聊天室
  .on('quit_room', quitRoom(socket, io))
  //连接保存信息
  .on('connect_user', connect(socket, io))
  //房间列表
  .on('room', getRoom(socket, io))

  //好友申请
  .on('invite_friend', inviteFriend(socket, io))
  //同意申请
  .on('agree_friend', agreeFriend(socket, io))
  //拒绝申请
  .on('disagree_friend', disagreeFriend(socket, io))
  //好友申请列表
  .on('invite_friend_list', inviteFriendList(socket, io))
}
