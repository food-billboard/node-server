const {
	dealErr,
	Params,
	responseDataDeal,
	getClient
} = require("@src/utils")
const { cloneDeep, set } = require("lodash")
const { ComponentUtil, mergeWithoutArray } = require('./index')

module.exports = async (ctx, callback) => {
  const check = Params.body(ctx, {
		name: "type",
		validator: [
			(data) => ['component', 'undo', 'redo', 'guideLine', 'callback', 'screen'].includes(data)
		],
	}, {
		name: 'action',
		validator: [
			(data, origin) => {
				return ['undo', 'redo'].includes(origin.type) || !!data
			}
		]
	})

	if (check) return

	const {
		version,
		_id,
		type,
		action 
	} = ctx.request.body
	const client = getClient()

	const data = await client.get(_id)
	.then(data => {
		if(!data) return Promise.reject({ status: 400, errMsg: 'overtime' })
		return data 
	})
	.then(data => {
		const { dataPool, version: prevVersion, _id, history } = data
		const { isUndoDisabled, isRedoDisabled, value } = history
		const currentScreenData = dataPool[value]

		if(!currentScreenData) return Promise.reject({ errMsg: 'not found', status: 404 })

		let newRedisConfig = {}

		if(type === 'redo') {
			if(isRedoDisabled) {
				return 
			}
			const newData = history.history.redo(data)
			newRedisConfig = {
				...data,
				history: {
					...newData.history,
				},
			}
		}else if(type === 'undo') {
			if(isUndoDisabled) {
				return 
			}
			const newData = history.history.undo(data)
			newRedisConfig = {
				...data,
				history: {
					...newData.history,
				},
			}
		}else {
			const undoKey = generateUndoKey() 

			const newData = history.history.enqueue(data, undoKey, history.value)

			let newScreenData = cloneDeep(currentScreenData)

			if(type === 'callback') {
				set(newScreenData, 'config.attr.filter', action)
			}else if(type === 'screen') {
				newScreenData = mergeWithoutArray({}, newScreenData, action)
			}else if(type === 'guideLine') {
				set(newScreenData, 'config.attr.guideLine', action)
			}else {
				newScreenData = ComponentUtil.setComponent(newScreenData, action)
			}
	
			newRedisConfig = {
				...data,
				dataPool: {
					...dataPool,
					[undoKey]: newScreenData,
				},
				history: {
					...newData.history,
					value: undoKey,
				},
			}
		}

		return {
			...newRedisConfig,
			version: version || prevVersion,
		}
		
	})
	.then(redisConfig => {

    const { dataPool, version, _id, history: { value } } = redisConfig
    const screenData = dataPool[value]

    return callback(screenData, _id, version)
    .then(() => {
      return client.setex(_id, MAX_POOL_LIVE_TIME / 1000, redisConfig)
    })
	})
	.then(() => {
		return {
			data: _id 
		}
	})
	.catch(dealErr(ctx))

	responseDataDeal({
		ctx,
		data,
		needCache: false,
	})
}