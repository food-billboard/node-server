const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { Types: { ObjectId } } = require('mongoose')
const { log4Error } = require('@src/config/winston')
const { MemberModel, UserModel, FriendsModel } = require('../../mongodb/mongo.lib')

/** 
 * 同步成员、用户、好友 的 id 映射关系
 * 生成不存在的用户好友信息
 * 生成不存在的用户成员信息
*/

function scheduleMethod({
  test=false
}={}) {
  console.log(chalk.yellow('聊天普通用户生成成员信息定时审查'))

  return UserModel.aggregate([
    {
      $project: {
        _id: 1
      }
    }
  ])
  .then(userList => {
    return MemberModel.aggregate([
      {
        $match: {
          user: {
            $type: 7
          }
        }
      },
      {
        $project: {
          _id: 1,
          user: 1,
        }
      }
    ])
    .then(data => {
      const needGenerateUser = userList.filter(item => {
        return !data.some(member => member.user && member.user.equals(item._id))
      })
      return Promise.all(needGenerateUser.map(item => {
        const { _id } = item 
        const model = new MemberModel({
          user: _id,
        })
        return model.save()
      }))
    })
    .then(_ => {
      return MemberModel.aggregate([
        {
          $project: {
            _id: 1,
            user: 1,
          }
        }
      ])
    })
    .then(memberList => {
      return FriendsModel.aggregate([
        {
          $project: {
            _id: 1,
            user: 1,
          }
        }
      ])
      .then(friendList => {
        const needGenerateUser = memberList.filter(item => {
          return ObjectId.isValid(item.user) && !friendList.some(friend => friend.user && friend.user.equals(item.user))
        })
        return Promise.all(needGenerateUser.map(item => {
          const { _id, user } = item 
          const model = new FriendsModel({
            user: ObjectId(user),
            member: ObjectId(_id) 
          })
          return model.save()
        }))
      })
    })
    .then(_ => {
      return FriendsModel.aggregate([
        {
          $project: {
            _id: 1,
            user: 1,
          }
        }
      ])
    })
    .then(friendList => {
      const needUpdateUser = friendList.filter(friend => {
        return !userList.some(user => friend._id.equals(user.friend_id))
      })
      return Promise.all(needUpdateUser.map(friend => {
        const { user, _id } = friend
        return UserModel.updateOne({
          _id: ObjectId(user) 
        }, {
          $set: {
            friend_id: _id
          }
        })
      }))
    })
  })
  .catch(err => {
    !!test && log4Error({
      __request_log_id__: '聊天普通用户生成成员信息定时审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

const unGenerateChatUserSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0  0  22  *  *  *', scheduleMethod)

}

module.exports = {
  unGenerateChatUserSchedule,
  scheduleMethod
}