const Router = require("@koa/router")
const {
	verifyTokenToData,
	dealErr,
	Params,
	responseDataDeal,
	getClient,
	ScreenModal,
	ScreenModelModal,
	notFound,
} = require("@src/utils")
const {
	Types: { ObjectId },
} = require("mongoose")
const { cloneDeep, set } = require("lodash")
const History = require("./component-util/history")
const { ComponentUtil, mergeWithoutArray } = require('./component-util')
const CommonUpdate = require('./component-util/update')

const router = new Router()

// 最大的流式保存有效时间
const MAX_POOL_LIVE_TIME = 1000 * 60 * 10
// 最大等待存活接口时间
const MAX_WAITING_LIVE_TIME = 1000 * 4

const generateUndoKey = () => Date.now() + "_" + Math.random()
const generateCheckLiveKey = (id) => id + 'CHECK_LIVE_KEY'

// redis 数据结构
/*
{
  dataPool: {
    [undoKey]: JSON.parse(data)
  },
  version,
  _id,
  history: {
    history,
    isUndoDisabled: true,
    isRedoDisabled: true,
    value: undoKey
  }
}
*/

router
.use(async (ctx, next) => {
	const method = ctx.request.method.toLowerCase()
	const validKeys = {
		post: "body",
		put: "body",
		get: "query",
		delete: "query",
	}
	const validKey = validKeys[method]
	const check = Params[validKey](ctx, {
		name: "_id",
		validator: [
			(value) => {
				return ObjectId.isValid(value)
			},
		],
	})

	if (check) {
		return
	}

	await next()
})
// 创建流式保存
.post("/", async (ctx) => {
	const check = Params.body(ctx, {
		name: "type",
		validator: [
			(value) => {
				return ["screen", "model"].includes(value)
			},
		],
	})

	if (check) {
		return
	}

	const { _id, type } = ctx.request.body

	const [, token] = verifyTokenToData(ctx)
	const { id } = token
	const client = getClient()
	const model = type === "screen" ? ScreenModal : ScreenModelModal

	const data = await client
		.get(_id)
		.then((data) => {
			if (data) {
				return client.get(generateCheckLiveKey(_id))
				.then(data => {
					if(data) {
						return Promise.reject({
							status: 400,
							errMsg: "有用户正在编辑",
						})
					}
				})
			}
		})
		.then(() => {
			return model
				.findOne({
					_id: ObjectId(_id),
					user: ObjectId(id),
					enable: false,
				})
				.select({
					data: 1,
					version: 1,
				})
				.exec()
		})
		.then(notFound)
		.then((result) => {
			const { data, version } = result
			const undoKey = generateUndoKey()
			const history = new History()
			return client.setex(_id, MAX_POOL_LIVE_TIME / 1000, {
				dataPool: {
					[undoKey]: JSON.parse(data),
				},
				version,
				_id,
				history: {
					history,
					isUndoDisabled: true,
					isRedoDisabled: true,
					value: undoKey,
				},
			})
		})
		.then(() => {
			return {
				data: _id,
			}
		})
		.catch(dealErr(ctx))

	responseDataDeal({
		ctx,
		data,
	})
})
// 检查保存的过期时间
.get("/", async (ctx) => {
	const { _id } = ctx.query

	const client = getClient()

	const data = await client
		.get(_id)
		.then((data) => {
			if(data) client.setex(generateCheckLiveKey(_id), MAX_WAITING_LIVE_TIME / 1000, _id)
			return {
				data: !!data,
			}
		})
		.catch(dealErr(ctx))

	responseDataDeal({
		ctx,
		data,
	})
})
.put("/", async (ctx) => {

	const [, token] = verifyTokenToData(ctx)
	const { id } = token

	await CommonUpdate(ctx, (screenData, _id, version) => {

		const { description, name, poster } = screenData

		return ScreenModal.updateOne({
			_id: ObjectId(_id),
			user: ObjectId(id),
			enable: false 
		}, {
			$set: {
				description,
				name,
				poster,
				version,
				data: JSON.stringify(screenData)
			}
		})
		.then(data => {
			if(data && data.nModified == 0) return Promise.reject({ errMsg: 'notFound', status: 404 })
		})
	})
	
})

module.exports = router
