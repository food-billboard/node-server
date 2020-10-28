const Router = require('@koa/router')
const { UserModel, verifyTokenToData, dealErr, notFound, responseDataDeal, Params, ROLES_MAP, findMostRole } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...nextCheck) => {
    return Params.body(ctx, {
        name: 'mobile',
        validator: [data => /^1[3456789]\d{9}$/.test(data.toString())]
    }, {
        name: 'password',
        validator: [data => typeof data === 'string' && data.length >= 8 && data.length <= 20]
    }, {
        name: 'email',
        validator: [data => EMAIL_REGEXP.test(data)]
    }, {
        name: 'username',
        validator: [
            data => typeof data === 'string' ? data > 0 && data <= 20 : typeof data === 'undefined'
        ]
    }, {
        name: 'description',
        validator: [
            data => typeof data === 'string' ? data > 0 && data <= 50 : typeof data === 'undefined'
        ]
    }, {
        name: 'avatar',
        validator: [
            data => typeof data === 'string' ? ObjectId.isValid(data) : typeof data === 'undefined'
        ]
    }, {
        name: 'role',
        validator: [
            data => typeof data === 'string' ? Object.values(ROLES_MAP).includes(data.toUpperCase())  : typeof data === 'undefined'
        ]
    }, ...nextCheck)
}

router
//预查角色分配相关
.use(async (ctx, next) => {
    const { request: { method } } = ctx
    const [ , token ] = verifyTokenToData(ctx)
    const { mobile } = token
    const _method = method.toLowerCase()

    let _id

    try {
        if(_method === 'delete') {
            _id = ctx.query._id
        }else if(_method === 'put') {
            _id = ctx.request.body._id
        }
    }catch(err){}

    const data = await UserModel.findOne(
        (_method === 'delete' || _method === 'put') ?
        {
            $or: [
                {
                    mobile: Number(mobile)
                },
                {
                    _id: ObjectId(_id)
                }
            ]
        }
        :
        {
            mobile: Number(mobile)
        }
    )
    .select({
        _id: 0,
        mobile: 1,
        roles: 1
    })
    .exec()
    .then(data => !!data && data)
    .then(notFound)
    .then(data => {
        const maxRoleAuth = Object.keys(ROLES_MAP).length - 1
        const minRoleAuth = 0
        let forbidden = false
        //删除
        if(_method === 'delete') {
            if(data.length != 2) return Promise.reject({ errMsg: 'unknown error', status: 500 })
            const [target] = data.filter(item => item.mobile != mobile)
            const targetRole = findMostRole(target.roles)

            if(!roles.some(role => typeof ROLES_MAP[role] == 'undefined' ? false : (ROLES_MAP[role] <= ROLES_MAP.DEVELOPMENT) && ROLES_MAP[role] < targetRole)) {
                forbidden = true
            }
        }
        //编辑
        else if(_method === 'put') {
            if(data.length != 2) return Promise.reject({ errMsg: 'unknown error', status: 500 })
            const [target] = data.filter(item => item.mobile != mobile)
            const targetRole = findMostRole(target.roles)
            if(!roles.some(role => typeof ROLES_MAP[role] == 'undefined' ? false : (ROLES_MAP[role] <= ROLES_MAP.DEVELOPMENT && targetRole > ROLES_MAP[role]) )) {
                forbidden = true
            }
        }
        //新增
        else if(_method === 'post') {
            const { roles } = data
            const targetRole = findMostRole(roles)
            let newUserRole = Number(ctx.query.role)
            newUserRole = (Number.isNaN(newUserRole) || newUserRole > maxRoleAuth || newUserRole < minRoleAuth) ? maxRoleAuth : targetRole
            if(targetRole > ROLES_MAP.DEVELOPMENT || targetRole >= newUserRole) {
                forbidden = true
            }
        }

        if(forbidden) return Promise.reject({ errMsg: 'forbidden', status: 403 })
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

    const check = checkParams(ctx)

    if(check) return

    let userModel = {}
    const [ role ] = Params.sanitizers(ctx.body, {
        name: 'role',
        sanitizers: [
            data => Number.isNaN(Number(data)) ? data: Object.keys(ROLES_MAP).length - 1
        ]
    })
    const params = [ 'mobile', 'password', 'email', 'username', 'description', 'avatar', 'role' ]
    const { request: { body } } = ctx
    const { mobile:newUserMobile, email } = body

    userModel = Object.keys(body).reduce((acc, cur) => {
        if(params.includes(cur)) {
            if(typeof cur == 'undefined' && cur == 'role') {
                acc[cur] = role
            }else if(typeof cur != 'undefined') {
                acc[cur] = body[cur]
            }
        }
        return acc
    }, {})

    const [, token] = verifyTokenToData(ctx)
    const { mobile } = token

    const data = await UserModel.find({
        $or: [
            {
                mobile: { $in: [ Number(mobile), Number(newUserMobile) ] }
            },
            {
                email
            }
        ]
    })
    .select({
        mobile: 1
    })
    .exec()
    .then(data => {
        if(data.length == 0) return Promise.reject({ status: 403, errMsg: 'forbidden' })
        if(data.length >= 2 || (data.length == 1 && data[0]._doc.mobile != Number(newUserMobile))) return Promise.reject({ status: 400, errMsg: 'user exists' }) 
        const model = new UserModel(userModel)
        return model.save()
    })
    .then(data => ({ data: { _id: data._id } }))
    .catch(dealErr(ctx))

    responseDataDeal({
        ctx,
        data,
        needCache: false
    })

})
//修改
.put('/', async(ctx) => {

    const check = checkParams(ctx, {
        name: '_id',
        type: [ 'isMongoId' ]
    })

    if(check) return

    let editModel = {}
    const [ _id, role ] = Params.sanitizers(ctx.body, {
        name: '_id',
        sanitizers: [
            data => ObjectId(data)
        ]
    }, {
        name: 'role',
        sanitizers: [
            data => Number.isNaN(Number(data)) ? data: Object.keys(ROLES_MAP).length - 1
        ]
    })
    const params = [ 'mobile', 'password', 'email', 'username', 'description', 'avatar', 'role' ]
    const { request: { body } } = ctx
    const { mobile:newUserMobile, email } = body

    editModel = Object.keys(body).reduce((acc, cur) => {
        if(params.includes(cur)) {
            if(typeof cur == 'undefined' && cur == 'role') {
                acc[cur] = role
            }else if(typeof cur != 'undefined') {
                acc[cur] = body[cur]
            }
        }
        return acc
    }, {})

    const data = await UserModel.findOneAndUpdate({

    })
    .catch(dealErr(ctx))

    responseDataDeal({
        ctx,
        data,
        needCache: false
    })

})
//删除
.delete('/', async(ctx) => {

    const check = checkParams(ctx, {
        name: '_id',
        type: [ 'isMongoId' ]
    })

    if(check) return

    const [ _id ] = Params.sanitizers(ctx.body, {
        name: '_id',
        sanitizers: [
            data => ObjectId(data)
        ]
    })

    const data = await UserModel.deleteOne({
        _id
    })
    .then(data => {
        if(typeof data !== 'object' || (typeof data === 'object' && data.nModified != 1)) return Promise.reject({ errMsg: 'error', status: 500 })
        return {
            data: {
                _id
            }
        }
    })
    .catch(dealErr(ctx))

    responseDataDeal({
        ctx,
        data,
        needCache: false
    })

})

module.exports = router