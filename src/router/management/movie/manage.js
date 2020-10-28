const Router = require('@koa/router')
const { UserModel, MovieModel, dealErr, notFound, Params, verifyTokenToData, responseDataDeal, ROLES_MAP, findMostRole } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//权限判断
.use(async (ctx, next) => {
    const { request: { method } } = ctx
    const _method = method.toLowerCase()

    if(_method === 'post') return await next()

    const [ , token ] = verifyTokenToData(ctx)
    const { mobile } = token

    let _id
    let movieData

    try {
        _id = _method == 'put' ? ctx.request.body._id : ctx.query._id
    }catch(err) {}

    const data = MovieModel.findOne({
        _id
    })
    .select({
        source_type: 1,
        author: 1
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(data => {
        if(!data) return Promise.reject({ errMsg: 'not found', status: 404 })

        movieData = data
        const { author } = data

        let query = {
            $or: [
                {
                    _id: author
                },
                {
                    mobile: Number(mobile)
                }
            ]
        }

        return UserModel.find(query)
        .select({
            _id: 1,
            roles: 1,
            mobile
        })
        .exec()
    })
    .then(data => !!data && !!data.length)
    .then(notFound)
    .then(data => {
        if(data.length == 1) {
            if(data[0].mobile != mobile) return Promise.reject({ errMsg: 'not found', status: 404 })
        }else {
            let manageRoles
            let userRoles 
            const { author, source_type } = movieData
            //查找对应的用户
            data.forEach(item => {
                const { mobile: _mobile, _id, roles } = item
                if(mobile == _mobile) {
                    manageRoles = roles
                }else if(_id.equals(author)) {
                    userRoles = roles
                }
            })

            const maxManageRole = findMostRole(manageRoles)
            const maxUserRole = findMostRole(userRoles)

            //权限判断
            if(source_type === 'ORIGIN') {
                if(maxManageRole > ROLES_MAP.SUPER_ADMIN) {
                    return false
                }
            }else {
                if(maxManageRole >= maxUserRole) {
                    return false
                }
            }
        }
        return true
    })
    .then(data => {
        if(!data) return Promise.reject({ errMsg: 'forbidden', status: 403 })
    })
    .catch(dealErr(ctx))

    if(!data) return await next()

    responseDataDeal({
        ctx,
        data,
        needCache: false
    })

})
//新增
.post('/', async(ctx) => {
  
})
//修改
.put('/', async(ctx) => {

})
//删除
.delete('/', async(ctx) => {
  
})

module.exports = router