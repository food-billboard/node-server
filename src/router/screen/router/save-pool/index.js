const Router = require("@koa/router")
const {
	verifyTokenToData,
	dealErr,
	Params,
	responseDataDeal,
	ScreenModal,
	ScreenModelModal,
	notFound,
} = require("@src/utils")
const {
	Types: { ObjectId },
} = require("mongoose")
const { ScreenPoolUtil } = require('./component-util/history')
const CommonUpdate = require('./component-util/update')

const router = new Router()

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
	const model = type === "screen" ? ScreenModal : ScreenModelModal

	const data = await new Promise((resolve, reject) => {
		try {
			resolve(ScreenPoolUtil.isOvertime(_id))
		}catch(err) {
			reject(err)
		}
	})
		.then((data) => {
			if(!data) {
				const result = ScreenPoolUtil.isCheckTimestampsOvertime(_id)
				if(!result) {
					return Promise.reject({
						status: 400,
						errMsg: "有用户正在编辑",
					})
				}
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
			ScreenPoolUtil.createScreenPool(_id, result)
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

	const data = await new Promise((resolve, reject) => {
		try {
			resolve(ScreenPoolUtil.isOvertime(_id) || ScreenPoolUtil.isCheckTimestampsOvertime(_id))
		}catch(err) {
			reject(err)
		}
	})
		.then((data) => {
			if(!data) ScreenPoolUtil.updateScreenPoolCheckTimestamps(_id)
			return {
				data: !data,
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
