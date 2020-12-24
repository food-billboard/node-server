require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateComment, mockCreateMovie, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel, CommentModel, MovieModel } = require('@src/utils')
const Day = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const COMMON_API = '/api/customer/user/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  //data
  expect(target).is.a('object').and.that.includes.all.keys('comment')
  target.comment.forEach((item) => {
    expect(item).is.a('object').that.includes.all.keys('content', 'createdAt', 'updatedAt', 'source', 'total_like', '_id', 'like', 'user_info')
    //content
    expect(item).to.be.have.a.property('content').that.is.a('object').and.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    expect(item.content).to.have.a.property('image').that.is.a('array')
    expect(item.content).to.have.a.property('video').that.is.a('array')
    expect(item.content.image.every(media => typeof media === 'string')).to.be.true
    expect(item.content.video.every(media => typeof media === 'string')).to.be.true
    //createdAt
    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    // //soruce_type
    // commonValidate.string(item.source_type, (target) => {
    //   return !!~['movie', 'user'].indexOf(target.toLowerCase())
    // })
    //source
    expect(item).have.a.property('source').that.is.a('object').and.includes.all.keys('type', '_id', 'content')
    commonValidate.objectId(item.source._id)
    
    commonValidate.string(item.source.type, (target) => {
      return !!~['movie', 'comment'].indexOf(target.toLowerCase())
    })
    expect(item.source.content).satisfies(function(target) {
      return typeof target === 'string' || target == null
      // return item.source.type.toLowerCase() == 'movie' ? target == null : typeof target === 'string'
    })
    //total_like
    commonValidate.number(item.total_like)
    //_id
    commonValidate.objectId(item._id)
    //like
    expect(item.like).to.be.a('boolean')

    expect(item.user_info).to.be.a('object').and.that.includes.all.keys('avatar', 'username')
    commonValidate.poster(item.user_info.avatar)
    commonValidate.string(item.user_info.username)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get the user comment list and not self and with self info test -> ${COMMON_API}`, function() {

    let userResult
    let userId
    let movieId
    let selfToken 

    before(function(done) {
      
      const { model:user } = mockCreateUser({
        username: COMMON_API,
        mobile: 15856998742
      })
      const { model:self, signToken } = mockCreateUser({
        username: COMMON_API,
        mobile: 15636887459
      })
      const { model:movie } = mockCreateMovie({
        name: COMMON_API
      })
      
      Promise.all([
        user.save(),
        self.save(),
        movie.save()
      ])
      .then(function([user, self, movie]) {
        userResult = user
        userId = user._id
        movieId = movie._id
        console.log
        selfToken = signToken(self._id)

        const { model } = mockCreateComment({
          source_type: 'comment',
          source: ObjectId('56aa3554e90911b64c36a424'),
          user_info: userId,
          total_like: 1,
          like_person: [ self._id ],
          content: {
            text: COMMON_API
          }
        })
        const { model: origin } = mockCreateComment({
          source_type: 'movie',
          source: movieId,
          user_info: userId,
          content: {
            text: COMMON_API
          }
        })

        return Promise.all([
          model.save(),
          origin.save()
        ])
      })
      .then(([comment, origin]) => {
        return Promise.all([
          UserModel.updateOne({
            mobile: 15856998742
          }, {
            $pushAll: { comment: [comment._id, origin._id] }
          }),
          CommentModel.updateOne({
            user_info: userId,
            total_like: 1
          }, {
            source: origin._id
          }),
          MovieModel.updateOne({
            name: COMMON_API
          }, {
            comment: [ origin._id ]
          })
        ])
      })
      .then(function(_) {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      Promise.all([
        UserModel.deleteMany({
          username: COMMON_API
        }),
        CommentModel.deleteMany({
          user_info: userResult._id,
        }),
        MovieModel.deleteMany({
          name: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get the user comment list and not self and with self info success test -> ${COMMON_API}`, function() {

      beforeEach(async function() {

        updatedAt = await UserModel.findOne({
          _id: userId,   
        })
        .select({
          _id: 0,
          updatedAt: 1
        })
        .exec()
        .then(data => {
          return data._doc.updatedAt
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return !!updatedAt ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the user comment list and not self and with self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: userResult._id.toString(),
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
          }
          responseExpect(obj)
          done()
        })

      })

      // it(`get the user comment list and not self and with self info success and return the status of 304`, function(done) {

      //   const query = {
      //     _id: userResult._id.toString()
      //   }

      //   Request
      //   .get(COMMON_API)
      //   .query({
      //     _id: userResult._id.toString(),
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .set({
      //     Accept: 'Application/json',
      //     'If-Modified-Since': updatedAt,
      //     'If-None-Match': createEtag(query)
      //   })
      //   .expect(304)
      //   .expect('Last-Modified', updatedAt.toString())
      //   .expect('ETag', createEtag(query))
      //   .end(function(err, _) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

      // it(`get the user comment list and not self and with self info success and return the status of 200 but the content has edited`, function(done) {

      //   const query = {
      //     _id: userResult._id.toString()
      //   }

      //   Request
      //   .get(COMMON_API)
      //   .query(query)
      //   .set({
      //     Accept: 'Application/json',
      //     'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
      //     'If-None-Match': createEtag(query),
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(304)
      //   .expect('Last-Modified', updatedAt.toString())
      //   .expect('ETag', createEtag(query))
      //   .end(function(err, _) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

      // it(`get the user comment list and not self and with self info success and hope return the status of 304 but the query has change`, function(done) {

      //   const query = {
      //     _id: userResult._id.toString()
      //   }

      //   Request
      //   .get(COMMON_API)
      //   .query(query)
      //   .set({
      //     Accept: 'Application/json',
      //     'If-Modified-Since': new Date(Day(userResult.updatedAt).valueOf - 10000000),
      //     'If-None-Match': createEtag({
      //       ...query,
      //       count: 9
      //     }),
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(200)
      //   .expect('Last-Modified', updatedAt.toString())
      //   .expect('ETag', createEtag(query))
      //   .end(function(err, _) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

    })

    describe(`get the user comment list and not self and with self info fail test -> ${COMMON_API}`, function() {

      it(`get the user comment list and not self and with self info fail because the user id is not found`, function(done) {

        const id = userId.toString()

        Request
        .get(COMMON_API)
        .query({'_id': `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`})
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user comment list and not self and with self info fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query('_id', userId.toString().slice(1))
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})
