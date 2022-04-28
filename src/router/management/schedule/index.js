const Router = require('@koa/router')
const { pick } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')
const { scheduleConstructor, Params, dealErr, responseDataDeal, notFound, ScheduleModel, SCHEDULE_STATUS } = require("@src/utils")

const router = new Router()

router
.get("/", async (ctx) => {

  const data = await ScheduleModel.find({})
  .exec()
  .then(data => {
    return {
      data: data.map(item => {
        return pick(item, ['_id', 'name', 'description', 'status', 'time', 'createdAt', 'updatedAt'])
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx 
  })
  
})
.post("/resume", async (ctx) => {

  // const data = await scheduleConstructor.resumeAllSchedule()
  // .then(_ => {
  //   return {
  //     data: true
  //   }
  // })
  // .catch(dealErr(ctx))

  responseDataDeal({
    data: {
      data: true 
    },
    needCache: false,
    ctx
  })

})
.use(async (ctx, next) => {
  const { method } = ctx.request
  const body = (method.toLowerCase() === "delete") ? "query" : "body" 
  const check = Params[body](ctx, {
    name: "_id",
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  return await next()
})
.put("/time", async (ctx) => {
  
  const check = Params.body(ctx, {
    name: "time",
    validator: [
      data => {
        return scheduleConstructor.isTimeValid(data)
      }
    ]
  })

  if(check) return 

  const [ time, _id ] = Params.sanitizers(ctx.request.body, {
    name: "time",
    sanitizers: [
      data => scheduleConstructor.formatTime(data)
    ]
  }, {
    name: "_id",
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await ScheduleModel.aggregate([
    {
      $match: {
        time 
      }
    }
  ])
  .then(data => {
    if(data.length) return Promise.reject({ errMsg: "bad request", status: 400 })
  })
  .then(_ => {
    return ScheduleModel.findOneAndUpdate({
      _id,
    }, {
      $set: {
        time 
      }
    })
    .select({
      name: 1 
    })
    .exec()
  })
  .then(notFound)
  .then(data => {
    return scheduleConstructor.changeScheduleTime({
      name: data.name,
      time, 
    })
  })
  .then(() => {
    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })

})
.put("/", async (ctx) => {

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: "_id",
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await ScheduleModel.findOneAndUpdate({
    _id,
    status: SCHEDULE_STATUS.CANCEL
  }, {
    $set: {
      status: SCHEDULE_STATUS.SCHEDULING
    }
  })
  .select({
    name: 1,
    time: 1 
  })
  .exec()
  .then(notFound)
  .then(data => {
    return scheduleConstructor.restartSchedule({
      name: data.name,
      time:data.time 
    })
  })
  .then(data => {
    return {
      data: _id 
    }
  })  
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })
})
.delete("/", async (ctx) => {

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: "_id",
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await ScheduleModel.findOneAndUpdate({
    _id,
    status: SCHEDULE_STATUS.SCHEDULING
  }, {
    $set: {
      status: SCHEDULE_STATUS.CANCEL
    }
  })
  .select({
    name: 1,
    time: 1 
  })
  .exec()
  .then(notFound)
  .then(data => {
    return scheduleConstructor.cancelSchedule({
      name: data.name,
      time: data.time 
    })
  })
  .then(() => {
    return {
      data: _id 
    }
  })  
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })
})
.post("/", async(ctx) => {

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: "_id",
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await ScheduleModel.findOne({
    _id
  })
  .select({
    name: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    return scheduleConstructor.dealSchedule(data.name)
  })
  .then(notFound)
  .then(() => {
    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })

})

module.exports = router