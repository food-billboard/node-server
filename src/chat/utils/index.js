require('module-alias/register')
const { nanoid } = require('nanoid')
const { Types: { ObjectId } } = require('mongoose')
const { FriendsModel, UserModel } = require('@src/utils')  
const { request } = require('./request')

const isTempUserExists = (data) => {
  const { temp_user_id } = data
  if(typeof temp_user_id === 'string' && !!temp_user_id) return temp_user_id
  return nanoid()
}

const getAllSockets = (socket) => {
  try {
    const sockets = socket.server.sockets
    return sockets
  }catch(err) {
    return new Map()
  }
}

const getAllSocketsId = (socket) => {
  const sockets = getAllSockets(socket)
  return Array.from(sockets.keys())
}

const getSocketId = (socket, id) => {
  const sockets = getAllSocketsId(socket)
  return sockets.find(item => item === id)
}

const getSocket = (socket, id) => {
  const sockets = getAllSockets(socket)
  return sockets.get(id)
}

const errWrapper = (error) => {
  const { errMsg } = error
  return {
    success: false,
    res: {
      errMsg,
      origin: error
    }
  } 
}

const connection = async (socket, next) => {
  const { id } = socket

  socket.join(id)

  await next()

}

const broadcastRoomMember = () => {
  
}

const findFriends = async (_id) => {
  const idList = (Array.isArray(_id) ? _id : [_id]).map(item => ObjectId(item))
  const data = await FriendsModel.aggregate([
    {
      $match: {
        _id: {
          $in: idList
        }
      }
    },
    {
      $lookup: {
        from: 'members', 
        localField: 'member', 
        foreignField: '_id', 
        as: 'member'
      }
    },
    {
      $unwind: "$member"
    },
    {
      $project: {
        _id: 1,
        member_id: "$member._id",
        user: "$member.user",
        sid: "$member.sid"
      }
    }
  ])
  return data 
}

module.exports = {
  connection,
  request,
  isTempUserExists,
  errWrapper,
  getAllSockets,
  getAllSocketsId,
  getSocketId,
  getSocket,
  findFriends
}