const { verifyTokenToData } = require('../token')
const url_map = require('./url-map')
const { BehaviourModel } = require('../mongodb')
const Url = require('url')

const NEED_DEAL_ROLE = [ 'CUSTOMER', 'USER' ]

const notes_customer_behaviour_middleware = async (ctx, next) => {
  const { request: { url, method } } = ctx
  const pathname = Url.parse(url)
  let action
  Object.keys(url_map).some(url => {
    if(url == pathname && method.toLowerCase() == url_map[url].method) {
      action = url_map[url]
      return false
    }
    return true
  })

  //只处理登录用户且非后台用户行为
  if(/\/api\/manage\/.+/.test(url) || !action) return await next()
  const [, token] = verifyTokenToData(ctx)

  let user
  //暂时不处理
  let target

  if(token) {
    user = token._id
    if(token.role && !~NEED_DEAL_ROLE.indexOf(token.role.toUpperCase())) return await next()
  }

  new Promise((resolve, reject) => {
    const database = action({ user, target })
    const model = new BehaviourModel(database)
    model.save(function(err) {
      if(err) reject(err)
      resolve()
    })
  })
  .catch(err => {
    console.log(err)
  })

  return await next()

}

module.exports = {
  notes_customer_behaviour_middleware
}