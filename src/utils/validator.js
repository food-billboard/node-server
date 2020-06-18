const Validator = require('validator')
const { isType } = require('./tool')

const TEMPLATE_ERROR = ctx => {
  ctx.status = 400
  return {
    success: false,
    res: {
      errMsg: 'bad request'
    }
  }
}

const Params = {
  sanitizers(origin, ...target) {
    return target.map(san => {
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
        if(result === undefined) throw new Error('name is not defined')
        //自定义
        let realSan = Array.isArray(sanitizers) ? sanitizers.filter(san => isType(san, 'function')) : []
        type.forEach(t => {
          let method = t.match(/.+(?=\()/)
          let params = t.match(/(?<=\().+(?=\))/)
          method = method && method[0]
          params = params && params[0]
          result = isType(Validator[method], 'function') ? 
            Validator[method](...(params ? [ result, ...params.split(',').map(p => p.trim()) ] : [result])) : 
            result
        })
        realSan.forEach(san => {
          result = san(result)
        })
        return result
      }catch(err) {
        if(_default) result = _default
        return result
      }
    })
  },
  bodyUnStatus(origin, ...validators) {
    const data = this.validate(origin, validators)
    return data
  },
  query(ctx, ...validators) {
    const { query } = ctx
    const data = this.validate(query, validators)
    if(data) {
      const res = TEMPLATE_ERROR(ctx)
      return {
        errors: data,
        res
      }
    }
    return data
  },
  body(ctx) {
    const { body } = ctx.request
    const data = this.validate(body, validators)
    if(data) {
      const res = TEMPLATE_ERROR(ctx)
      return {
        errors: data,
        res
      }
    }
    return data
  },
  files(ctx, names) {
    const { files } = ctx.request
    const data = !!files && names.every(name => !!files[name] && !!files[name].size)
    if(!data) {
      const res = TEMPLATE_ERROR(ctx)
      return {
        errors: data,
        res
      }
    }
    return null
  },
  validate(origin, validators) {
    let errs = []
    let response = validators.every(validate => {
      const { name, validator=[], type=[] } = validate
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
        if(!data) {
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
        Array.isArray(validator) ? validator.filter(val => isType(val, 'function')).every(val => val(data)) : true
      )
      if(!result) errs.push(name)
      return result
    })
    if(response) return null
    return errs
  }
}

module.exports = {
  Params
}