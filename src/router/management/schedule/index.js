const Router = require('@koa/router')
const { scheduleConstructor, Params, dealErr, responseDataDeal, notFound } = require("@src/utils")

const router = new Router()

router
.get("/", async (ctx) => {

  responseDataDeal({
    data: {
      data: scheduleConstructor.getScheduleList()
    },
    needCache: false,
    ctx 
  })
  
})
.post("/resume", async (ctx) => {

  const data = await scheduleConstructor.resumeAllSchedule()
  .then(_ => {
    return {
      data: true
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })

})
.use(async (ctx, next) => {
  const { method } = ctx.request
  const body = (method.toLowerCase() === "delete") ? "query" : "body" 
  const check = Params[body](ctx, {
    name: "name",
    validator: [
      data => {
        return scheduleConstructor.isScheduleExists(data)
      }
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

  const { name } = ctx.request.body 

  const [ time ] = Params.sanitizers(ctx.request.body, {
    name: "time",
    sanitizers: [
      data => scheduleConstructor.formatTime(data)
    ]
  })

  const data = await scheduleConstructor.changeScheduleTime({
    name,
    time
  })

  responseDataDeal({
    data: data ? { data: true } : dealErr(ctx)({ errMsg: "change time error", status: 500 }),
    needCache: false,
    ctx
  })

})
.put("/", async (ctx) => {

  const { name } = ctx.request.body 

  const data = await scheduleConstructor.restartSchedule({
    name,
  })

  responseDataDeal({
    data: data ? { data: true } : dealErr(ctx)({ errMsg: "restart schedule error", status: 500 }),
    needCache: false,
    ctx
  })
})
.delete("/", async (ctx) => {

  const { name } = ctx.query

  const data = await scheduleConstructor.cancelSchedule({
    name,
  })

  responseDataDeal({
    data: data ? { data: true } : dealErr(ctx)({ errMsg: "cancel schedule error", status: 500 }),
    needCache: false,
    ctx
  })
})
.post("/", async(ctx) => {

  const { name } = ctx.request.body

  const data = await scheduleConstructor.dealSchedule(name)
  .then(notFound)
  .then(data => {
    return {
      data
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