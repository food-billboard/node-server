const Router = require('@koa/router')
const { dealErr, responseDataDeal, Params, verifyTokenToData, getClient } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { nanoid } = require('nanoid')
const { fetchDouData } = require('./utils')

const router = new Router()

router
  .get('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: 'id',
      validator: [
        data => !!data 
      ]
    })

    if (check) return

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const { id:_id } = ctx.query

    const data = await fetchDouData({
      movieId: _id,
      userId: ObjectId(id)
    })
      .then(data => {
        const redisClient = getClient()
        const id = nanoid()
        return new Promise((resolve, reject) => {
          const jsonString = JSON.stringify(data)
          redisClient.setex(id, 10 * 60, jsonString, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve(id)
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
      name: 'id',
      validator: [
        data => !!data
      ]
    })

    if (check) return

    const { id:_id } = ctx.query

    const redisClient = getClient()

    const data = await new Promise((resolve, reject) => {
      redisClient.get(_id, (err, data) => {
        if (err || !data) {
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