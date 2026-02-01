const Router = require('@koa/router')
const {
  dealErr,
  Params,
  responseDataDeal,
  HolidayModel
} = require('@src/utils')

const router = new Router()

router
  .post('/', async (ctx) => {
    //validate params
    const check = Params.body(ctx, {
      name: 'year',
      validator: [
        data => !!data
      ]
    }, {
      name: 'holiday',
      validator: [
        data => Array.isArray(data)
      ]
    })
    if (check) return

    const { year, holiday } = ctx.request.body

    const data = await HolidayModel.updateOne({
      year,
    }, {
      $set: {
        holiday
      }
    })
      .then((data) => {
        if (data.nModified == 0) {
          //database
          const model = new HolidayModel({
            year,
            holiday
          })
          return model.save()
        }
      })
      .then(data => {
        return {
          data: data._id
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })
  })
  .get('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: 'year',
      multipart: true,
      validator: [
        (data) => !!data
      ]
    })
    if (check) return

    const { year } = ctx.query

    //database
    const data = await HolidayModel.findOne({
      year
    })
      .select({
        _id: 1,
        year: 1,
        holiday: 1
      })
      .exec()
      .then(data => {
        if (!data) {
          return {
            data: {
              year,
              holiday: []
            }
          }
        }
        return {
          data: {
            year,
            holiday: data.holiday
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })


module.exports = router