const { expect } = require('chai')
expect('123').to.be.a('string').and.that.lengthOf.above(0).to.satisfy(function() {
  return true
})