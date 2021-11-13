require('module-alias/register')
const { UserModel, CommentModel, MovieModel, ImageModel, COMMENT_SOURCE_TYPE, ROLES_NAME_MAP } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateComment, mockCreateImage, parseResponse, deepParseResponse, envSet, envUnSet } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")
const Day = require('dayjs')

const COMMON_API = '/api/manage/movie/detail/comment'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'user_info', 'comment_count', 'total_like', 'like_person_count', 'content', 'createdAt', 'updatedAt')
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').that.includes.all.keys('_id', 'username')
    commonValidate.number(item.comment_count)
    commonValidate.number(item.total_like)
    commonValidate.number(item.like_person_count)
    expect(item.content).to.be.a('object').and.that.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    expect(item.content.image).to.be.a('array')
    item.content.image.forEach(img => commonValidate.poster(img))
    expect(item.content.video).to.be.a('array')
    item.content.video.forEach(vi => commonValidate.poster(vi))
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let selfToken
  let userInfo
  let imageId
  let movieId
  let oneCommentId
  let twoCommentId

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      user.save(),
      image.save()
    ])
    .then(([user, image]) => {
      userInfo = user
      imageId = image._id
      selfToken = signToken(userInfo._id)

      const { model } = mockCreateMovie({
        name: COMMON_API
      })

      return model.save()

    })
    .then(data => {
      movieId = data._id

      const { model: one } = mockCreateComment({
        source_type: COMMENT_SOURCE_TYPE.movie,
        source: movieId,
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 10
      })
      const { model: two } = mockCreateComment({
        source_type: COMMENT_SOURCE_TYPE.movie,
        source: movieId,
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 5,
        sub_comments: [ ObjectId('571094e2976aeb1df982ad4e') ]
      }) 

      return Promise.all([
        one.save(),
        new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, 200)
        })
        .then(_ => {
          return two.save()
        })
      ])

    })
    .then(([one, two]) => {
      oneCommentId = one._id
      twoCommentId = two._id
      return MovieModel.updateOne({
        name: COMMON_API
      }, {
        $set: { comment: [ oneCommentId, twoCommentId ] }
      })
    })
    .then(function() {
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
        "content.text": COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    describe(`get movie success test -> ${COMMON_API}`, function() {
      it(`get the movie comment list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId.toString()
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
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with comment`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId.toString(),
          comment: -1
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
          responseExpect(obj, (target) => {
            const { list } = target
            const { _id } = list[0]
            expect(oneCommentId.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of hot`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId.toString(),
          hot: -1
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
          responseExpect(obj, (target) => {
            const { list } = target
            const { _id } = list[0]
            expect(oneCommentId.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of time`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId.toString(),
          time: -1
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
  
      it(`get the movie comment list with sort of start_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId,
          start_date: Day(Date.now() + 1000 * 24 * 60 * 60).format('YYYY-MM-DD')
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of end_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId,
          end_date: '2019-10-11'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })
    })

    describe(`post comment success test -> ${COMMON_API}`, function() {

      it(`post comment success and post comment`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          source_type: COMMENT_SOURCE_TYPE.comment,
          _id: oneCommentId.toString(),
          content: {
            text: COMMON_API,
            image: [
              imageId.toString()
            ]
          }
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function(data) {
          let obj = deepParseResponse(data)
          obj = ObjectId(obj)
          return Promise.all([
            CommentModel.findOne({
              _id: oneCommentId,
              sub_comments: {
                $in: [
                  obj
                ]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            CommentModel.findOne({
              _id: obj
            })
            .select({
              _id: 1
            })
            .exec(),
            UserModel.findOne({
              _id: userInfo._id,
              comment: {
                $in: obj 
              }
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(data => {
          expect(data.every(item => !!item)).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`post comment success and post movie`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          source_type: COMMENT_SOURCE_TYPE.movie,
          _id: movieId.toString(),
          content: {
            text: COMMON_API,
            image: [
              imageId.toString()
            ]
          }
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function(data) {
          let obj = deepParseResponse(data)
          return Promise.all([
            MovieModel.findOne({
              _id: movieId,
              comment: {
                $in: [
                  obj
                ]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            CommentModel.findOne({
              _id: obj
            })
            .select({
              _id: 1
            })
            .exec(),
            UserModel.findOne({
              _id: userInfo._id,
              comment: {
                $in: obj 
              }
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(data => {
          expect(data.every(item => !!item)).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })

      })

    })

    describe(`delete comment success test -> ${COMMON_API}`, function() {
      
      it(`delete comment success`, function(done) {

        let movieCommentId 
        let commentCommentId 

        const { model: movieComment } = mockCreateComment({
          source_type: COMMENT_SOURCE_TYPE.movie,
          source: movieId,
          content: {
            text: COMMON_API,
            image: [ imageId ],
            video: []
          },
          user_info: userInfo._id,
          total_like: 10
        })

        movieComment.save()
        .then(data => {
          movieCommentId = data._id 
          const { model: commentComment } = mockCreateComment({
            source_type: COMMENT_SOURCE_TYPE.comment,
            source: movieCommentId,
            content: {
              text: COMMON_API,
              image: [ imageId ],
              video: []
            },
            user_info: userInfo._id,
            total_like: 10
          })
          return commentComment.save()
        })
        .then(data => {
          commentCommentId = data._id 
          return Promise.all([
            MovieModel.updateOne({
              _id: movieId,
            }, {
              $push: {
                comment: movieCommentId
              }
            }),
            CommentModel.updateOne({
              _id: movieCommentId
            }, {
              $push: {
                sub_comments: commentCommentId
              }
            })
          ])
        })
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .set({
            Accept: 'application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            _id: movieCommentId.toString()
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function(data) {
          return Promise.all([
            CommentModel.find({
              _id: {
                $in: [
                  commentCommentId,
                  movieCommentId
                ]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            UserModel.findOne({
              _id: userInfo._id,
              comment: {
                $in: [
                  movieCommentId,
                  commentCommentId 
                ]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            MovieModel.findOne({
              _id: movieId,
              comment: {
                $in: [
                  movieCommentId
                ]
              }
            })
          ])
        })
        .then(([comment, user, movie]) => {
          expect(comment.length).to.be.equal(0) 
          expect(!!user).to.be.false
          expect(!!movie).to.be.false
          done()
        })
        .catch(err => {
          done(err)
        })

      
      
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get comment fail test -> ${COMMON_API}`, function() {

      it(`get the movie comment list fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })
  
      })

    })

    describe(`post comment fail test -> ${COMMON_API}`, function() {

      it(`post comment fail because the user is not the auth`, function(done) {

        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            roles: [
              ROLES_NAME_MAP.CUSTOMER
            ]
          }
        })
        .then(envSet)
        .then(data => {
          return Request
          .post(COMMON_API)
          .set({
            Accept: 'application/json',
            Authorization: `Basic ${selfToken}`
          })
          .send({
            source_type: movieId.toString(),
            _id: oneCommentId.toString(),
            content: {
              text: COMMON_API,
              image: [
                imageId.toString()
              ]
            }
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo._id 
          }, {
            $set: {
              roles: [
                ROLES_NAME_MAP.SUPER_ADMIN
              ]
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`post comment fail because the source_type is not valid`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          source_type: "233",
          _id: oneCommentId.toString(),
          content: {
            text: COMMON_API,
            image: [
              imageId.toString()
            ]
          }
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(data => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`post comment fail because not found source_type params`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: oneCommentId.toString(),
          content: {
            text: COMMON_API,
            image: [
              imageId.toString()
            ]
          }
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(() => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`post comment fail because the _id is not valid`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          source_type: COMMENT_SOURCE_TYPE.comment,
          _id: oneCommentId.toString().slice(1),
          content: {
            text: COMMON_API,
            image: [
              imageId.toString()
            ]
          }
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(() => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`post the comment fail because not found the _id`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          source_type: COMMENT_SOURCE_TYPE.comment,
          _id: oneCommentId.toString().slice(1),
          content: {
            text: COMMON_API,
            image: [
              imageId.toString()
            ]
          }
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(() => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

    })

    describe(`delete comment fail test -> ${COMMON_API}`, function() {
      
      it(`delete comment fail because the user is not the auth`, function(done) {

        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            roles: [
              ROLES_NAME_MAP.CUSTOMER
            ]
          }
        })
        .then(envSet)
        .then(data => {
          return Request
          .delete(COMMON_API)
          .set({
            Accept: 'application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            _id: oneCommentId.toString()
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo._id 
          }, {
            $set: {
              roles: [
                ROLES_NAME_MAP.SUPER_ADMIN
              ]
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`delete comment fail because the _id is not valid`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) return done(err) 
          done()
        })

      })

      it(`delete comment fail because not found the _id`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) return done(err) 
          done()
        })

      })

    })

  })

})