const { Types: { ObjectId } } = require('mongoose')
const { MemberModel, UserModel, FriendsModel } = require('../mongodb/mongo.lib')
const { encoded } = require('../token')
const { ROLES_NAME_MAP } = require('../constant')

function createInitialMember(userId) {
  const model = new MemberModel({
    user: userId,
    room: []
  })
  return model.save()
}

function createInitialFriends(userId, memberId) {
  const model = new FriendsModel({
    user: userId,
    member: memberId,
  })
  return model.save()
}

function createInitialUserInfo({ mobile, password, username, avatar, description, ...nextData }) {

  let defaultModel = {
    mobile,
    password: encoded(password),
    fans: [],
    attention: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    rate: [],
    allow_many: false,
    status: 'SIGNIN',
    roles: [ROLES_NAME_MAP.CUSTOMER],
    score: 0,
    ...nextData
  }
  if(ObjectId.isValid(avatar)) defaultModel.avatar = avatar 
  if(!!username) {
    const [ realUsername, map] = username.split('\/9098')
    defaultModel.username = realUsername
    if(map) defaultModel.roles = [ ROLES_NAME_MAP[map] || ROLES_NAME_MAP.CUSTOMER ]
  } 
  if(!!description) defaultModel.description = description
  return defaultModel
}

function initialUserData(data={}) {
  let result 
  const model = new UserModel(createInitialUserInfo(data))
  return model.save()
  .then(data => {
    result = data 
    const { _id } = result
    return createInitialMember(_id)
    .then((member) => {
      return createInitialFriends(_id, member._id)
    })
    .then(data => {
      return UserModel.updateOne({
        _id: data.user,
      }, {
        $set: {
          friend_id: data._id
        }
      })
    }) 
  })
  .then(() => {
    return result 
  })
}

module.exports = initialUserData