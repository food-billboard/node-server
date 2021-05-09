const { Types: { ObjectId } } = require('mongoose')

const MAP = {
  objectId: (value) => {
    return ObjectId.isValid(value)
  },
  
}

module.exports = MAP