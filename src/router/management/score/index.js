const Router = require('@koa/router')
const Award = require('./award')
const Memory = require('./memory')
const Classify = require('./classify')
const JoinTask = require('./join-task')
const router = new Router()

router
// 奖品
.use('/award', Award.routes(), Award.allowedMethods())
// 兑换记录 积分记录
.use('/memory', Memory.routes(), Memory.allowedMethods())
// 积分分类
.use('/classify', Classify.routes(), Classify.allowedMethods())
// 任务参与
.use('/join-task', JoinTask.routes(), JoinTask.allowedMethods())

module.exports = router