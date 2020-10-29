const { ROLES_DATABASE_MAP } = require('./map')
const { AuthModel, ApisModel, UserModel } = require('../mongodb/mongo.lib')
const { log4Error } = require('@src/config/winston')
const { verifyTokenToData } = require('../token')
const { responseDataDeal, dealErr, notFound } = require('../error-deal')
const Url = require('url')

//暂时定义管理后台api前缀且现在只管理它
const PREFIX = [ '/api/manage' ]

const initAuthMapData = () => {
  Promise.all([
    AuthModel.find({})
    .select({
      _id: 1
    })
    .exec()
    .then(data => {
      if(data.length == ROLES_DATABASE_MAP.length) return
      return Promise.all(ROLES_DATABASE_MAP.map(role => {
        const model = new AuthModel(role)
        return model.save()
      }))
    }),
    ApisModel.find({})
    .select({
      _id: 1
    })
    .exec()
    .then(data => {
      if(data.length == APIS_DATABASE_MAP.length) return
      return Promise.all(APIS_DATABASE_MAP.map(api => {
        const model = new ApisModel(api)
        return model.save()
      }))
    })
  ])
  .catch(err => {
    log4Error({ __request_log_id__: 'auth_map_error' }, err)
    console.log(err)
  })
}

const authMiddleware = async (ctx, next) => {
  const { request: { method, url } } = ctx
  const { pathname } = Url.parse(url)
  //不在限制范围内
  if(!PREFIX.every(prefix => prefix.startsWith(url))) return await next()
  const [, token] = verifyTokenToData(ctx)
  let data 
  let roles = []

  if(token) {
    ROLES_DATABASE_MAP.forEach(role => {
      const { allow: { actions }, roles:_role } = role
      actions.every(action => {
        const { url, methods } = action
        if(role.includes('SUPER_ADMIN') || (url == pathname && (methods == '*' || (Array.isArray(methods) && methods.includes(method.toLowerCase()))))) {
          roles = [ ...new Set([ ...roles, ..._role ]) ]
          return false
        }
        return true
      })

    })
  }

  roles = !!roles.length ? roles : false

  //若包含最低访问权限则直接放行
  if(roles && roles.includes('USER')) return await next()

  data = await (!token ? Promise.reject({ errMsg: 'not authorization', status: 401 }) : Promise.resolve()) //未登录
  .then(_ => roles)
  //不在权限范围内表示不可访问
  .then(notFound)
  .then(_ => {
    const { mobile } = token
    return UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      roles: 1,
      _id: 0
    })
    .exec()
  })
  .then(data => !!data && data._doc)
  //未找到用户
  .then(notFound)
  .then(({ roles:user_have_roles }) => {
    const result = roles.every(role => {
      if(user_have_roles.includes(role)) {
        return false
      }
      return true
    })
    if(result) return Promise.reject({ errMsg: 'forbidden', status: 403 })
  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

}

module.exports = {
  initAuthMapData,
  authMiddleware
}