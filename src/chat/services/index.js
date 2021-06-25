const { merge } = require('lodash')
const request = require('../utils/request')

const generateToken = (method) => async (socket, data, params, headers={}) => {
  const { token } = data
  const newHeaders = merge({}, headers, {
    authorization: `Basic ${token}`
  })
  return method(params, newHeaders)
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

//房间列表
const getRoomList = async (data, headers) => {
  return request(url('/api/chat/room'), {
    method: 'GET',
    params: data,
    headers
  })
}

//删除消息
const deleteMessage = async (data, headers) => {
  return request(url('/api/chat/message'), {
    method: 'DELETE',
    params: data,
    headers
  })
}

//消息详情
const getMessageDetail = async (data, headers) => {
  return request(url('/api/chat/message/detail'), {
    method: 'GET',
    params: data,
    headers
  })
}

//读消息
const readMessage = async (data, headers) => {
  return request(url('/api/chat/message'), {
    method: 'PUT',
    data,
    headers
  })
}

//发起聊天
const createRoom = async (data, headers) => {
  return request(url('/api/chat/room'), {
    method: 'POST',
    data,
    headers
  })
}

//进入房间
const joinRoom = async (data, headers) => {
  return request(url('/api/chat/room/join'), {
    method: 'POST',
    data,
    headers
  })
}

//离开房间(下线)
const leaveRoom = async (data, headers) => {
  return request(url('/api/chat/room'), {
    method: 'PUT',
    data,
    headers
  })
}

//退出房间
const quitRoom = async (data, headers) => {
  return request(url('/api/chat/room/join'), {
    method: 'DELETE',
    params: data,
    headers
  })
}

//删除房间
const deleteRoom = async (data, headers) => {
  return request(url('/api/chat/room'), {
    method: 'DELETE',
    params: data,
    headers
  })
}

//发送消息
const postMessage = async (data, headers) => {
  return request(url('/api/chat/message'), {
    method: 'POST',
    data,
    headers
  })
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
  postMessage: generateToken(postMessage),
  createRoom: generateToken(createRoom),
  getRoomList: generateToken(getRoomList),
}