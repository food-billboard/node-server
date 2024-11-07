const Router = require('@koa/router')
const {
  ScreenShotModel,
  dealErr,
  notFound,
  Params,
  responseDataDeal,
  verifyTokenToData,
  ScreenModal,
  parseData,
  MAX_SCREEN_SHOT_COUNT
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...params) => {
  return Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, ...params)
}

router
  // 快照列表
  .get('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const { content, _id } = ctx.query
    let query = {
      screen: ObjectId(_id)
    }
    if (typeof content === 'string' && !!content) {
      query.description = {
        $regex: content,
        $options: 'gi'
      }
    }

    let aggregate = [
      {
        $match: query,
      },
      {
        $limit: 999
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user_info'
        }
      },
      {
        $unwind: {
          path: "$user_info",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          description: 1,
          user: "$user_info._id",
          username: "$user_info.username",
          avatar: "$user_info.avatar",
          createdAt: 1,
          updatedAt: 1,
        }
      }
    ]

    const data = await Promise.all([
      ScreenShotModel.aggregate([
        {
          $match: query
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
      ScreenShotModel.aggregate(aggregate)
    ])
      .then(([total, data]) => {
        return {
          data: {
            list: data,
            total: !!total.length ? total[0].total || 0 : 0,
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
  // 新增快照
  .post('/', async (ctx) => {
    const check = checkParams(ctx)
    if (check) return

    const { request: { body: { _id, description = '' } } } = ctx

    const [, token] = verifyTokenToData(ctx)
    const { id } = token
    let screenData = ''

    const data = await ScreenModal.findOne({
      user: ObjectId(id),
      _id
    })
      .select({
        _id: 1,
        data: 1,
        name: 1,
        poster: 1,
        description: 1,
        version: 1
      })
      .exec()
      .then(data => {
        const result = parseData(data)
        if (!result) return Promise.reject({ errMsg: 'not self screen', status: 400 })
        screenData = result
      })
      .then(() => {
        return ScreenShotModel.aggregate([
          {
            $match: {
              screen: _id
            },
          },
          {
            $limit: 999
          },
          {
            $project: {
              _id: 1,
            }
          }
        ])
          .then(data => {
            const length = !!data.length ? data[0].total || 0 : 0
            if (length > MAX_SCREEN_SHOT_COUNT) return Promise.reject({ errMsg: 'to much screen shot', status: 400 })
            const model = new ScreenShotModel({
              screen: _id,
              user: ObjectId(id),
              description,
              data: JSON.stringify(screenData)
            })
            return model.save()
          })
      })
      .then(data => {
        if (!data) return Promise.reject({ errMsg: 'unknown error', status: 500 })

        return {
          data: {
            data: data._id
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
  // 修改快照信息
  .put('/', async (ctx) => {

    const check = checkParams(ctx, {
      name: 'screen',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })
    if (check) return

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const [_id, screen] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'screen',
      sanitizers: [
        data => ObjectId(data)
      ]
    })
    const { request: { body: { description } } } = ctx

    const data = await ScreenModal.findOne({
      user: ObjectId(id),
      _id: screen
    })
      .select({
        _id: 1,
        data: 1
      })
      .exec()
      .then(data => {
        const result = parseData(data)
        if (!result) return Promise.reject({ errMsg: 'not self screen', status: 400 })
      })
      .then(() => {
        return ScreenShotModel.updateOne({
          _id
        }, {
          $set: {
            description,
          }
        })
      })
      .then(data => {
        if (data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })

        return {
          data: {
            data: null
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
  // 删除快照
  .delete('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => data.split(',').every(item => ObjectId.isValid(item.trim()))
      ]
    }, {
      name: 'screen',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const [_ids, screen] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => data.split(',').map(item => ObjectId(item.trim()))
      ]
    }, {
      name: 'screen',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const data = await ScreenModal.findOne({
      user: ObjectId(id),
      _id: screen
    })
      .select({
        _id: 1,
        screen_shot: 1
      })
      .exec()
      .then(data => {
        const result = parseData(data)
        if (!result) return Promise.reject({ errMsg: 'not self screen', status: 400 })
        if (_ids.some(item => item.equals(result.screen_shot))) return Promise.reject({ errMsg: 'screen shot is in use', status: 400 })
      })
      .then(() => {
        return ScreenShotModel.deleteMany({
          _id: { $in: _ids }
        })
      })
      .then(data => {
        if (data.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
        return {
          data: {
            data: null
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
  // 使用快照
  .post('/use', async (ctx) => {
    const check = checkParams(ctx, {
      name: 'screen',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })
    if (check) return

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const [_id, screen] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'screen',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const data = await ScreenModal.findOneAndUpdate({
      user: ObjectId(id),
      _id: screen
    }, {
      $set: {
        screen_shot: _id
      }
    })
      .select({
        _id: 1,
      })
      .exec()
      .then(notFound)
      .then(() => {
        return {
          data: {
            data: null
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
  // 当前快照
  .get('/use', async (ctx) => {
    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const { request: { query: { _id } } } = ctx

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await ScreenModal.findOne({
      user: ObjectId(id),
      _id: ObjectId(_id)
    })
      .select({
        _id: 1,
        screen_shot: 1
      })
      .exec()
      .then(notFound)
      .then(data => {
        return {
          data: {
            data: data.screen_shot
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
  // 覆盖快照
  .post('/cover', async (ctx) => {
    const check = checkParams(ctx)
    if (check) return

    const [_id, screen] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'screen',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await ScreenModal.findOne({
      user: ObjectId(id),
      _id: screen
    })
      .select({
        _id: 1,
        data: 1,
        name: 1,
        poster: 1,
        description: 1,
        version: 1
      })
      .exec()
      .then(data => {
        const result = parseData(data)
        if (!result) return Promise.reject({ errMsg: 'not self screen', status: 400 })
        return ScreenShotModel.updateOne({
          _id,
          user: ObjectId(id),
        }, {
          $set: {
            data: JSON.stringify(result)
          }
        })
      })
      .then(data => {
        if (data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })

        return {
          data: {
            data: null
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
  // 快照详情
  .get('/detail', async (ctx) => {
    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const { request: { query: { _id } } } = ctx

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await ScreenShotModel.findOne({
      user: ObjectId(id),
      _id: ObjectId(_id)
    })
      .select({
        _id: 1,
        data: 1,
      })
      .exec()
      .then(notFound)
      .then(data => {
        const { data: screenData } = data 
        const objectScreenData = JSON.parse(screenData)
        const { data: components, ...nextScreenData } = objectScreenData
        return {
          data: {
            ...nextScreenData,
            components: JSON.parse(components)
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

module.exports = router