const { Types: { ObjectId } } = require('mongoose')

const MAP = {
  objectId: (value) => {
    return ObjectId.isValid(value)
  },
  password: (value) => {
    return typeof value === 'string' && value.length >= 8 && value.length <= 30
  }
}

module.exports = MAP