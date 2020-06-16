const Validator = require('validator')
const { isType } = require('./tool')

const Params = {
  query(ctx, ...validators) {
    const { query } = ctx
    return this.validate(query, validators)
  },
  body(ctx) {
    return () => {
      const { body } = ctx.request
      return this.validate(body, validators)
    }
  },
  files(ctx, names) {
    const { files } = ctx.request
    return !!files && names.every(name => !!files[name] && !!files[name].size)
  },
  validate(origin, validators) {
    let errs = []
    let response = validators.every(validae => {
      const { name, validator, type=[] } = validae
      const data = origin[name]
      let getValidate = validator && isType(validator, 'function') ? validator(data) : true
      let result = ( type.length ? type.every(t => {
        let method = t.match(/.+(?=\()/)
        let params = t.match(/(?>=\().+(?=\))/)
        method = method && method[0]
        params = params && params[0]
        return ( isType(Validator[method], 'function') ? Validator[method](...(params ? [ data, ...params.split(',').map(p => p.trim()) ] : [data])) : true )
      }) : true ) && getValidate
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