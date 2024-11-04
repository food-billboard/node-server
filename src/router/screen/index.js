const Router = require('@koa/router')
const Index = require('./router')
const Detail = require('./router/detail')
const Preview = require('./router/preview')
const Share = require('./router/share')
const Enable = require('./router/enable')
const Copy = require('./router/copy')
const Model = require('./router/model')
const Pre = require('./router/pre')
const Mock = require('./router/mock')
const media = require('./router/media')
const mediaClassify = require('./router/media-classify')

const { loginAuthorization } = require('@src/utils')

const router = new Router()

router
// .get('/test', async (ctx) => {
//   const { _id } = ctx.query

//   const { ScreenModal, dealErr, responseDataDeal } = require('@src/utils')
//   const { Types: { ObjectId } } = require('mongoose') 

//   const data = await ScreenModal.findOne({
//     _id: ObjectId(_id)
//   })
//   .select({
//     _id: 1,
//     data: 1,
//     name: 1,
//     poster: 1,
//     description: 1,
//     version: 1
//   })
//   .exec()
//   .then((result) => {

//     const { data, _id, name, poster, description, version } = result 

//     return {
//       data: {
//         _id, 
//         name, 
//         poster, 
//         description,
//         components: JSON.parse(data),
//         version
//       }
//     }
//   })
//   .catch(dealErr(ctx))

//   responseDataDeal({
//     ctx,
//     data
//   })

// })
.use('/mock', Mock.routes(), Mock.allowedMethods())
.use('/list', Index.routes(), Index.allowedMethods())
.use('/model', Model.routes(), Model.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())
.use('/share', Share.routes(), Share.allowedMethods())
//登录判断
.use(loginAuthorization())
.use('/media-classify', mediaClassify.routes(), mediaClassify.allowedMethods())
.use('/media', media.routes(), media.allowedMethods())
.use('/preview', Preview.routes(), Preview.allowedMethods())
.use('/enable', Enable.routes(), Enable.allowedMethods())
.use('/copy', Copy.routes(), Copy.allowedMethods())
.use('/pre', Pre.routes(), Pre.allowedMethods())

module.exports = router