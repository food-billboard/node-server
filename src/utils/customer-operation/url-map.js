const CUSTOMER_PREFIX = '/api/customer'
const USER_PREFIX = '/api/user'
const { Types: { ObjectId } } = require('mongoose')

const toId = (target) => ObjectId.isValid(target) ? ObjectId(target) : target

const user_behaviour = {
  //登录
  '/logon/account': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'LOGIN_IN',
      user: toId(user),
      target: toId(target),
    })
  },
  //退出
  '/logon/signout': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'LOGOUT',
      user: toId(user),
      target: toId(target),
    })
  },
  //获取用户信息
  '/customer/*': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'USER_GET',
      user: toId(user),
      target: toId(target),
    })
  },
  //专题
  '/home/speical': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'SPECIAL_GET',
      user: toId(user),
      target: toId(target),
    })
  },
  //电影排行榜
  '/movie/rank': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'RANK_GET',
      user: toId(user),
      target: toId(target),
    })
  },
  //电影
  '/movie/detail/*': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'MOVIE_GET',
      user: toId(user),
      target: toId(target),
    })
  },
  //搜索
  '/movie/search': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'SEARCH',
      user: toId(user),
      target: toId(target),
    })
  }

}
const customer_behaviour = {
  //上传
  '/manage/movie': {
    method: 'post',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'MOVIE_POST',
      user: toId(user),
      target: toId(target),
    })
  },
  //电影
  '/movie/detail/*': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'MOVIE_GET',
      user: toId(user),
      target: toId(target),
    })
  },
  //用户
  '/user/*': {
    method: 'get',
    action: ({ user, target }) => ({
      timestamps: Date.now(),
      url_type: 'USER_GET',
      user: toId(user),
      target: toId(target),
    })
  },
}

module.export = {
  ...Object.keys(user_behaviour).reduce((acc, cur) => {
    acc[`${USER_PREFIX}${cur}`] = user_behaviour[cur]
    return acc
  }, {}),
  ...Object.keys(customer_behaviour).reduce((acc, cur) => {
    acc[`${CUSTOMER_PREFIX}${cur}`] = user_behaviour[cur]
    return acc
  }, {})
}