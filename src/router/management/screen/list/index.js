const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, ScreenModal, isDateValid } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

const router = new Router()

router
.get('/', async (ctx) => {

  const { content, enable, createdAt, currPage, pageSize } = Params.sanitizers(ctx.query, {
    name: 'content',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) {

          function reg(content) {
            return {
              $regex: content,
              $options: 'gi'
            }
          }

          let filter = [
            {
              name: reg(data)
            },
            {
              description: reg(data)
            },
          ]

          return {
            done: true,
            data: {
              $or: filter
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'enable',
    sanitizers: [
      data => {
        if(typeof data !== 'string') {
          return {
            done: false,
          }
        }
        return {
          done: true,
          data: {
            enable: data === '1'
          }
        }
      },
    ]
  }, {
    name: 'createdAt',
    sanitizers: [
      data => {
        if(!Array.isArray(data) || !data.every(isDateValid)) {
          return {
            done: false,
          }
        }
        const [ start, end ] = data 
        let result = {
          createdAt: {}
        } 
        if(start) {
          result.createdAt.$gte = Day(start).toDate()
        }
        if(end) {
          result.createdAt.$lte = Day(end).toDate()
        }
        return {
          done: true,
          data: result
        }
      },
    ]
  }, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => {
        return {
          done: true,
          data: data >= 0 ? +data : 0
        }
      }
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => {
        return {
          done: true,
          data: data >= 0 ? +data : 30
        }
      }
    ]
  }, true)

  const data = await Promise.all([
    ScreenModal.aggregate([
      {
        $match: {
          ...content,
          ...enable,
          ...createdAt
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1
        }
      }
    ]),
    ScreenModal.aggregate([
      {
        $match: {
          ...content,
          ...enable,
          ...createdAt
        }
      },
      {
        $sort: {
          updatedAt: -1
        }
      },
      {
        $skip: currPage * pageSize
      },
      {
        $limit: pageSize 
      },
      {
        $lookup: {
          from: 'users',
          let: { 
            create_user_id: "$user"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$create_user_id" ]
                },
              }
            },
            {
              $lookup: {
                from: 'images',
                as: 'avatar',
                foreignField: "_id",
                localField: "avatar"
              }
            },
            {
              $unwind: {
                path: "$avatar",
                preserveNullAndEmptyArrays: true 
              }
            },
          ],
          as: 'user'
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          user: {
            username: "$user.username",
            avatar: "$user.avatar.src",
            _id: "$user._id",
          },
          enable: 1,
          flag: 1,
          description: 1,
          poster: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ])
  ])
  .then(([total_data, data]) => {

    const [ total={ total: 0 } ] = total_data

    return {
      list: data,
      total: total.total 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.delete('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id } = ctx.query

  const data = await ScreenModal.deleteOne({
    _id: ObjectId(_id)
  })
  .then(data => {
    if(data && data.deletedCount == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })

    return {
      data: _id 
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