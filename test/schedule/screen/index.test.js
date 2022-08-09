require('module-alias/register')
const { expect } = require('chai')
const { scheduleMethod } = require("@src/utils/schedule/screen/index.schedule")
const { ScreenPoolUtil } = require('@src/router/screen/router/save-pool/component-util/history')

const SCHEDULE_PREFIX = "schedule of unuse screen test"

describe(SCHEDULE_PREFIX, function() {

  let screenId 

  before(function(done) {

    try {
      screenId = ScreenPoolUtil.mockCretaeScreenPool()
      done()
    }catch(err) {
      done(err)
    }

  })

  after(function(done) {
    try {
      ScreenPoolUtil.clear()
      done()
    }catch(err) {
      done(err)
    }
  })

  it(`clear unuse screen data`, function(done) {

    scheduleMethod({
      test: true 
    })
    expect(ScreenPoolUtil.isOvertime(screenId)).to.be.true 
    done()

  })

})

