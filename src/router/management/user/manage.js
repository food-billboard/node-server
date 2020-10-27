const Router = require('@koa/router')
const { UserModel, verifyTokenToData, dealErr, notFound, responseDataDeal, Params, ROLES_MAP } = require('@src/utils')
const { Types: { ObjectId }, model } = require('mongoose')

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
            data => typeof data === 'string' ? ROLES_MAP.includes(data.toUpperCase())  : typeof data === 'undefined'
        ]
    }, ...nextCheck)
}

router
//新增
.post('/', async(ctx) => {

    const check = checkParams(ctx)

    if(check) return

    let userModel = {}
    const [ role ] = Params.sanitizers(ctx.body, {
        name: 'role',
        sanitizers: [
            data => typeof data === 'undefined' ? 'USER': data
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

    const data = await UserModel
  
    .catch(dealErr(ctx))

    responseDataDeal({
        ctx,
        data,
        needCache: false
    })

})

module.exports = router