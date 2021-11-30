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
      $unwind: "$attentions"
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
        as: 'attentions_user',
        foreignField: "_id",
        localField: "attentions._id"
      }
    },
    {
      $unwind: "$attentions_user"
    },
    {
      $lookup: {
        from: 'images',
        as: 'attentions_user.avatar',
        foreignField: "_id",
        localField: "attentions_user.avatar"
      }
    },
    {
      $unwind: {
        path: "$attentions_user.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $addFields: {
        attention_id_list: "$attentions_user.fans._id"
      }
    },
    {
      $addFields: {
        attention: {
          $cond: [
            {
              $in: [
                ObjectId(selfId), "$attention_id_list"
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
        _id: "$attentions_user._id",
        username: "$attentions_user.username",
        description: "$attentions_user.description",
        avatar: "$attentions_user.avatar.src",
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