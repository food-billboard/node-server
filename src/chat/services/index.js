const { merge } = require('lodash')
const request = require('../utils/request')

const generateToken = (method) => async (socket, data, params, headers={}) => {
  return method(params, headers)
}

const url = (address) => `http://localhost:4000${address}`

//连接服务器
const connectServer = async (data, headers) => {
  return request(url('/api/chat/connect'), {
    method: 'POST',
    data,
    headers
  })
}

//断开连接
const disConnectServer = async (data, headers) => {
  return request(url('/api/chat/disconnect'), {
    method: 'POST',
    data,
    headers
  })
}

//消息列表
const getMessageList = async (data, headers) => {
  return request(url('/api/chat/message'), {
    method: 'GET',
    params: data,
    headers
  })
}

//删除消息
const deleteMessage = async (data, headers) => {
  
}

//消息详情
const getMessageDetail = async (data, headers) => {

}

//读消息
const readMessage = async (data, headers) => {

}

//加入房间
const joinRoom = async (data, headers) => {

}

//离开房间
const leaveRoom = async (data, headers) => {

}

//退出房间
const quitRoom = async () => {

}

//删除房间
const deleteRoom = async () => {

}

module.exports = {
  connectServer: generateToken(connectServer),
  deleteMessage: generateToken(deleteMessage),
  getMessageDetail: generateToken(getMessageDetail),
  disConnectServer: generateToken(disConnectServer),
  getMessageList: generateToken(getMessageList),
  readMessage: generateToken(readMessage),
  joinRoom: generateToken(joinRoom),
  leaveRoom: generateToken(leaveRoom),
  quitRoom: generateToken(quitRoom),
  deleteRoom: generateToken(deleteRoom),
}