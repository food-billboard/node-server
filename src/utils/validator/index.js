const Validator = require('validator')
const { isType } = require('../tool')
const { responseDataDeal } = require('../error-deal')
const VALIDATOR_MAP = require('./common-validator-map')

const TEMPLATE_ERROR = ctx => {
  ctx.status = 400
  return {
    res: {
      success: false,
      res: {
        errMsg: 'bad request'
      }
    },
    err: true
  }
}

const Params = {
  sanitizers(origin, ...target) {
    let realTarget = target
    let returnData = []
    let pushFn = (acc, _, data) => {
      acc.push(data)
    }
    const targets = target.slice(0, -1)
    const [ abandon ] = target.slice(-1)
    const isAbandon = abandon === true
    if(isAbandon) {
      realTarget = targets
      returnData = {}
      pushFn = (acc, key, data) => {
        if(data === undefined) return 
        acc[key] = data
      }
    }

    function abandonFn(callback, result, getData=true) {
      if(isAbandon) {
        if(!result || !result.done || result.data === undefined) return false
        callback(getData ? result.data : result)
      }else {
        callback(result)
      }
      return true
    }

    return realTarget.reduce((acc, san) => {
      if(!isType(san, 'object')) return san
      const { name, _default, type=[], sanitizers=[] } = san
      let result

      try {
        if(name.includes('.')) {
          const deepArr = name.split('.')
          deepArr.forEach(deep => {
            if(!result) {
              result = origin[deep]
            }else {
              result = result[deep]
            }
          })
        }else {
          result = origin[name]
        }
        // if(result === undefined) console.warn('attentions! name is not defined')
        //自定义
        let realSan = Array.isArray(sanitizers) ? sanitizers.filter(san => isType(san, 'function')) : []
        type.forEach(t => {
          let method = t.match(/.+(?=\()/)
          let params = t.match(/(?<=\().+(?=\))/)
          method = method ? method[0] : t
          params = params && params[0]

          result = isType(Validator[method], 'function') ? 
          Validator[method](...(params ? [ result, ...params.split(',').map(p => p.trim()) ] : [result])) : 
          result
        })
        const _result = realSan.every((san, index) => {
          const _result = san(result)
          return abandonFn((data) => {
            result = data
          }, _result, index != realSan.length - 1)
        })
        if(!_result) {
          result = undefined 
        }
      }catch(err) {
        if(_default !== undefined) result = isAbandon ? {
          done: true,
          data: _default
        } : _default
      }finally {
        const realResult = ((!!result && typeof result === 'object' && result.done !== undefined && result.data !== undefined) || !isAbandon) ? result : { done: true, data: result }
        abandonFn((data) => {
          pushFn(acc, name, data)
        }, realResult, true)
      }
      return acc
    }, returnData)
  },
  bodyUnStatus(origin, ...validators) {
    const data = this.validate(origin, ...validators)
    return data
  },
  headers(ctx, ...validators) {
    const { request: { headers } } = ctx
    const data = this.validate(headers, ...validators)
    if(data) {
      responseDataDeal({
        ctx,
        data: TEMPLATE_ERROR(ctx)
      })
      return true
    }
    return data
  },
  query(ctx, ...validators) {
    const { query } = ctx
    const data = this.validate(query, ...validators)
    if(data) {
      // const res = TEMPLATE_ERROR(ctx)
      // return {
      //   errors: data,
      //   res
      // }
      //fail
      responseDataDeal({
        ctx,
        data: TEMPLATE_ERROR(ctx)
      })
      return true
    }
    return data
  },
  body(ctx, ...validators) {
    const { body } = ctx.request
    const data = this.validate(body, ...validators)
    if(data) {
      //fail
      // const res = TEMPLATE_ERROR(ctx)
      // return {
      //   errors: data,
      //   res
      // }
      //fail
      responseDataDeal({
        ctx,
        data: TEMPLATE_ERROR(ctx)
      })
      return true
      
    }
    return data
  },
  files(ctx, names) {
    const { files } = ctx.request
    const data = !!files && names.every(name => !!files[name] && !!files[name].size)
    if(!data) {
      // const res = TEMPLATE_ERROR(ctx)
      // return {
      //   errors: data,
      //   res
      // }
      responseDataDeal({
        ctx,
        data: TEMPLATE_ERROR(ctx)
      })
      return true
    }
    return null
  },
  validate(origin, ...validators) {
    let errs = []
    let response = validators.every(validate => {
      const { name, validator=[], type=[], multipart=false } = validate
      let data
      //多层次验证
      if(name.includes('.')) {
        const deepArr = name.split('.')
        if(!deepArr.every(deep => {
          if(!data) {
            data = origin[deep]
          }else {
            data = data[deep]
          }
          return !!data
        })) {
          errs.push(name)
          return false
        }
      }else {
        data = origin[name]
        if(data === undefined && !multipart) {
          errs.push(name)
          return false
        }
      }

      let result = ( type.length ? type.every(t => {
        let method = t.match(/.+(?=\()/)
        let params = t.match(/(?<=\().+(?=\))/)
        method = method && method[0]
        params = params && params[0]
        return ( 
          isType(Validator[method], 'function') ? 
          Validator[method](...(params ? [ data, ...params.split(',').map(p => p.trim()) ] : [data])) : 
          true 
        )
      }) : true ) && (
        //自定义
        Array.isArray(validator) ? validator.filter(val => isType(val, 'function')).every(val => val(data, origin)) : true
      )
      if(!result) errs.push(name)
      return result
    })
    if(response) return null
    return errs
  }
}

module.exports = {
  Params,
  VALIDATOR_MAP
}