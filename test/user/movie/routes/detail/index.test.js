require('module-alias/register')
const { expect } = require('chai')
const { mockCreateClassify, mockCreateMovie, mockCreateImage, Request, commonValidate } = require('@test/utils')

const COMMON_API = '/api/user/movie/detail'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').and.that.includes.all.keys(
    'author', 'author_description', 'author_rate', 'comment',
    'createdAt', 'glance', 'hot', 'images', 'info', 'name',
    'poster', 'rate', 'same_film', 'store', 'tag', 'video', '_id'
  )

  expect(target.author).to.be.a('object').and.have.a.property('username').and.is.a('string').and.that.lengthOf.above(0)
  commonValidate.string(target.author_description, function() { return true })
  commonValidate.number(target.author_rate)
  expect(target.comment).to.be.a('array')
  target.comment.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('user_info', 'content')
    expect(item.user_info).to.be.a('object').and.have.a.property('avatar')
    commonValidate.poster(item.user_info.avatar)
    expect(item.content).to.be.a('object').and.have.a.property('text').that.is.a('string')
  })
  commonValidate.date(target.createdAt)
  commonValidate.number(target.glance)
  commonValidate.number(target.hot)
  expect(target.images).to.be.a('array').and.that.lengthOf.above(0)
  target.images.forEach(item => {
    commonValidate.string(item)
  })
  expect(target.info).to.be.a('object').and.that.includes.all.keys(
    'actor', 'another_name', 'classify', 'description', 'director',
    'district', 'language', 'name', 'screen_time'
  )
  const { info: { actor, another_name, classify, description, director, district, language, name, screen_time } } = target
  commonValidate.time(screen_time)
  expect(actor).to.be.a('array').and.that.lengthOf.above(0)
  actor.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', 'other')
    const { name, other } = item
    commonValidate.string(name)
    expect(other).to.be.a('object').and.that.includes.all.keys('avatar')
    commonValidate.poster(other.avatar)
  })
  expect(another_name).to.be.a('array')
  another_name.forEach(item => commonValidate.string(item))
  expect(classify).to.be.a('array').and.that.lengthOf.above(0)
  classify.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  commonValidate.string(description)
  expect(director).to.be.a('array').and.that.lengthOf.above(0)
  director.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  expect(district).to.be.a('array').and.that.lengthOf.above(0)
  district.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  expect(language).to.be.a('array').and.that.lengthOf.above(0)
  language.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  commonValidate.string(name)
  
  commonValidate.string(target.name)
  commonValidate.poster(target.poster)
  commonValidate.number(target.rate)
  expect(target.same_film).to.be.a('array')
  target.same_film.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', '_id', 'same_type')
    commonValidate.string(item.name)
    commonValidate.objectId(item._id)
    commonValidate.string(item.same_type, function(target) {
      return ['SERIES', 'NAMESAKE'].indexOf(target.toUpperCase())
    })
  })
  expect(target.store).to.be.a('boolean')
  expect(target.tag).to.be.a('array')
  target.tag.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('text').that.is.a('string').and.that.lengthOf.above(0)
  })
  commonValidate.poster(target.video)
  commonValidate.objectId(target._id)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail without self info test -> ${COMMON_API}`, function() {
    
    describe(`get the movie detail without self info success test -> ${COMMON_API}`, function() {

      it(`get the movie detail without self info success`, function() {

      })

    })

    describe(`get the movie detail without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get the movie detail without self info fail bacause the movie id is not found`, function() {

      })

      it(`get the movie detail without self info fail because the movie id is not verify`, function() {

      })

      it(`get the movie detail without self info fail because lack the params of the movie id`, function() {
        
      })

    })

  })

})