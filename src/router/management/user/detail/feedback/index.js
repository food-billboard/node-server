const Router = require('@koa/router')
const { FeedbackModel, UserModel, dealErr, notFound, Params, responseDataDeal, verifyTokenToData, FEEDBACK_STATUS, findMostRole, ROLES_MAP } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')
const { Auth } = require('./auth')

const router = new Router()

router
//反馈列表
.get('/', async(ctx) => {

  const [ currPage, pageSize, _id, start_date, end_date, status ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => {
        return ObjectId.isValid(data) ? ObjectId(data) : false 
      }
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => typeof data === 'string' ? [ data ] : Object.keys(FEEDBACK_STATUS)
    ]
  })

  let match = {
    createdAt: {
      $lte: end_date,
      ...(!!start_date ? { $gte: start_date } : {})
    },
    status: {
      $in: status
    }
  }
  if(_id) match.user_info = _id

  const data = await Promise.all([
    //总数
    FeedbackModel.aggregate([
      {
        $match: match
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    FeedbackModel.aggregate([
      {
        $match: match
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
          localField: 'user_info', 
          foreignField: '_id', 
          as: 'user_info'
        }
      },
      {
        $unwind: "$user_info"
      },
      {
        $lookup: {
          from: 'videos', 
          localField: 'content.video', 
          foreignField: '_id', 
          as: 'video'
        }
      },
      {
        $lookup: {
          from: 'images', 
          localField: 'content.image', 
          foreignField: '_id', 
          as: 'image'
        }
      },
      {
        $project: {
          user_info: {
            _id: "$user_info._id",
            username: "$user_info.username"
          },
          createdAt: 1,
          updatedAt: 1,
          status: 1,
          content: {
            text: "$content.text",
            image: "$image.src",
            video: "$video.src"
          }
        }
      }
    ])
  ])
  .then(([total_count, feedback_data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(feedback_data)) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: feedback_data
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//修改feedback状态
.put('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: 'description',
    validator:[
      data => typeof data === 'string' && data.length > 0
    ]
  }, {
    name: '_id',
    validator:[
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ _id, status ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => typeof data == 'string' ? data : FEEDBACK_STATUS.DEAL
    ]
  })
  const { request: { body: { description } } } = ctx

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  
  const data = await FeedbackModel.updateOne({
    _id
  }, {
    $push: {
      history: { user: ObjectId(id), timestamps: new Date(), description }
    },
    $set: {
      status
    }
  })
  .then(data => {
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: null
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//权限判断
.use(Auth)
//删除
.delete('/', async(ctx) => {
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = await FeedbackModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: null
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