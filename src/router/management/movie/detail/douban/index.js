const Router = require('@koa/router')
const { dealErr, responseDataDeal, Param, verifyTokenToData, getClient } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { nanoid } = require('nanoid')
const { fetchDouData } = require('./utils')

const router = new Router()

router
  .get('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const data = await fetchDouData({
      movieId: _id,
      userId: ObjectId(id)
    })
      .then(data => {
        const redisClient = getClient()
        const id = nanoid()
        return new Promise((resolve, reject) => {
          redisClient.set(id, 10 * 60, JSON.stringify(data), (err) => {
            if (err) {
              reject()
            } else {
              resolve()
            }
          })
        })
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
  .get('/detail', async (ctx) => {
    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => !!data
      ]
    })

    if (check) return

    const { _id } = ctx.query

    const redisClient = getClient()

    const data = await new Promise((resolve, reject) => {
      redisClient.get(_id, (err, data) => {
        if (err) {
          reject({
            errMsg: err,
            status: 500
          })
        } else {
          resolve(JSON.parse(data))
        }
      })
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

module.exports = router