const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const { 
  VideoModel, 
  ImageModel, 
  dealErr, 
  responseDataDeal, 
  Params, 
} = require('@src/utils')
const Video = require('./video')

const router = new Router()

router
.get("/", async (ctx) => {

  const check = Params.query(ctx, {
    name: "type",
    validator: [
      data => ["video", "image"].includes(data)
    ]
  })

  if(check) return 

  const { type, ...nextQuery } = Params.sanitizers(ctx.query, {
    name: "type",
    sanitizers: [
      data => {
        switch(data) {
          case "image":
            return {
              done: true,
              data: {
                model: ImageModel,
                aggregate: [
                  {
                    $project: {
                      _id: 1,
                      src: 1,
                    }
                  }
                ]
              }
            }
          case "video":
            return {
              done: true,
              data: {
                model: VideoModel,
                aggregate: [
                  {
                    $lookup: {
                      from: 'images',
                      as: 'poster',
                      foreignField: "_id",
                      localField: "poster"
                    }
                  },
                  {
                    $unwind: {
                      path: "$poster",
                      preserveNullAndEmptyArrays: true 
                    }
                  },
                  {
                    $project: {
                      _id: 1,
                      src: 1,
                      poster: "$poster.src"
                    }
                  }
                ]
              }
            }
        }
      }
    ]
  }, {
    name: "src",
    sanitizers: [
      data => {
        if(data.split(",").every(item => /.+\/static\/(image|video).+/.test(item))) {
          return {
            done: true,
            data: {
              $in: data.split(",").map(item => {
                const [ target ] = item.match(/(?<=.+)\/static\/(image|video)\/.+/)
                return target 
              })
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: "_id",
    sanitizers: [
      data => {
        if(data.split(",").every(item => ObjectId.isValid(item))) {
          return {
            done: true,
            data: {
              $in: data.split(",").map(item => ObjectId(item))
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, true)

  const { aggregate, model: realModel } = type 

  const data = await new Promise((resolve, reject) => {
    if(Object.keys(nextQuery).length) {
      resolve()
    }else {
      reject({
        errMsg: "bad request",
        status: 400
      })
    }
  })
  .then(_ => {
    return realModel.aggregate([
      {
        $match: nextQuery
      },
      ...aggregate
    ])
  })
  .then(data => {
    return {
      data
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })


})
.use('/video', Video.routes(), Video.allowedMethods())

module.exports = router