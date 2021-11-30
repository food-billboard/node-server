const Router = require('@koa/router')
const { UserModel, dealErr, Params, responseDataDeal, verifyTokenToData } = require("@src/utils")
const { Types: { ObjectId } } = require("mongoose")

const router = new Router()

router
.get('/', async (ctx) => {

  //validate
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { id: selfId } = token

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })

  const data = await UserModel.aggregate([
    {
      $match: {
        _id,
      }
    },
    {
      $unwind: "$fans"
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
        as: 'fans_user',
        foreignField: "_id",
        localField: "fans._id"
      }
    },
    {
      $unwind: "$fans_user"
    },
    {
      $lookup: {
        from: 'images',
        as: 'fans_user.avatar',
        foreignField: "_id",
        localField: "fans_user.avatar"
      }
    },
    {
      $unwind: {
        path: "$fans_user.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $addFields: {
        fans_id_list: "$fans_user.fans._id"
      }
    },
    {
      $addFields: {
        attention: {
          $cond: [
            {
              $in: [
                ObjectId(selfId), "$fans_id_list"
              ]
            },
            true,
            false 
          ]
        }
      }
    },   
    {
      $project: {
        _id: "$fans_user._id",
        username: "$fans_user.username",
        description: "$fans_user.description",
        avatar: "$fans_user.avatar.src",
        attention: "$attention",
      }
    }
  ])
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