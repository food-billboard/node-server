const Router = require('@koa/router')
const Request = require('./request')
const Export = require('./export')
const LeadIn = require('./leadIn')

const router = new Router()

router
.use('/request', Request.routes(), Request.allowedMethods())
.use('/export', Export.routes(), Export.allowedMethods())
.use('/leadin', LeadIn.routes(), LeadIn.allowedMethods())

module.exports = router