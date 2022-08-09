const {
	dealErr,
	Params,
	responseDataDeal,
} = require("@src/utils")
const { cloneDeep, set, isNil } = require("lodash")
const { ScreenPoolUtil } = require('./history')
const { ComponentUtil } = require('./index')
const { mergeWithoutArray } = require('./constants')

module.exports = async (ctx, callback) => {
  const check = Params.body(ctx, {
		name: "type",
		validator: [
			(data) => ['component', 'undo', 'redo', 'guideLine', 'callback', 'screen'].includes(data)
		],
	})

	if (check) return

	const {
		version,
		_id,
		type,
		action 
	} = ctx.request.body

	const data = await new Promise((resolve, reject) => {
		try {
			resolve(ScreenPoolUtil.isCheckTimestampsOvertime(_id))
		}catch(err) {	
			reject(err)
		}
	})
	.then(data => {
		if(data) return Promise.reject({ status: 400, errMsg: 'overtime' })
		return ScreenPoolUtil.getState(_id) 
	})
	.then(data => {
		const { version: prevVersion, _id, history } = data
		const { isUndoDisabled, isRedoDisabled, value } = history
		const currentScreenData = history.history.state || value 

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

			let newScreenData = cloneDeep(currentScreenData)

			if(type === 'callback') {
				set(newScreenData, 'components.config.attr.filter', action)
			}else if(type === 'screen') {
				newScreenData.components = mergeWithoutArray({}, newScreenData.components, action)
				const changeConfigKeys = [
					'name', 'poster', 'description'
				]
				changeConfigKeys.forEach(item => {
					if(!isNil(action[item])) newScreenData[item] = action[item]
				})
			}else if(type === 'guideLine') {
				set(newScreenData, 'components.config.attr.guideLine', action)
			}else {
				newScreenData.components.components = ComponentUtil.setComponent(newScreenData, action)
			}

			const newData = history.history.enqueue(data, newScreenData, currentScreenData)
	
			newRedisConfig = {
				...data,
				history: {
					...newData.history,
					value: newScreenData
				},
			}
		}

		return {
			...newRedisConfig,
			version: version || prevVersion,
		}
		
	})
	.then(redisConfig => {

    const { version, _id, history: { value } } = redisConfig
    const screenData = value

    return callback(screenData, _id, version)
    .then(() => {
      ScreenPoolUtil.updateScreenPoolData(_id, redisConfig)
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