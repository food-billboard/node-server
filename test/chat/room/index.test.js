require('module-alias/register')
const { SpecialModel, UserModel, RoomModel, MessageModel, MemberModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, mockCreateMember, mockCreateMessage, mockCreateImage, mockCreateRoom } = require('@test/utils')

const COMMON_API = '/api/chat/room'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('object').and.that.include.all.keys('list', 'total')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('movie', 'description', 'valid', '_id', 'glance', 'createdAt', 'updatedAt', 'name')
    commonValidate.string(item.description)
    commonValidate.string(item.name)
    commonValidate.number(item.glance)
    commonValidate.objectId(item._id)
    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    expect(item.valid).to.be.a('boolean')
    expect(item.movie).to.be.a('array').and.that.not.length(0)
    item.movie.forEach(item => {
      expect(item).to.be.a('object').and.that.include.all.keys('name', '_id', 'poster')
      commonValidate.string(item.name)
      commonValidate.objectId(item._id)
      commonValidate.poster(item.poster)
    })
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

  let userInfo
  let selfToken
  let specialId
  let imageId 

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      user.save(),
      image.save(),
    ])
    .then(([user, image]) => {
      userInfo = user._id 
      selfToken = signToken(userInfo)
      imageId = image._id
      return Promise.all(
        new Array(3).fill(0).map((_, index) => {
          const { model } = mockCreateMovie({
            author_description: COMMON_API,
            name: COMMON_API + index,
            poster: imageId
          })
          return model.save()
        })
      )
    })
    .then(([movieA, movieB, movieC]) => {
      movieAId = movieA._id 
      movieBId = movieB._id 
      movieCId = movieC._id 
      const { model } = mockCreateSpecial({
        name: COMMON_API,
        description: COMMON_API,
        movie: [
          movieAId,
          movieBId,
          movieCId
        ],
        poster: imageId
      })
      return model.save()
    })
    .then(special => {
      specialId = special._id
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      SpecialModel.deleteMany({
        $or: [
          {
            name: COMMON_API
          },
          {
            description: COMMON_API
          }
        ]
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      MovieModel.deleteMany({
        author_description: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} get room list test`, function() {
      
    describe(`${COMMON_API} get room list success test`, function() {
      
      it(`get room list success`, function(done) {

        Request
        .get(COMMON_API)
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
            return done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
          })
          done()
        })

      })

      it(`get room list success with type`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })  

      it(`get room list success with _id`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })  

      it(`get room list success with origin`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })  

      it(`get room list success with create_user`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })  

      it(`get room list success with content`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })  

      it(`get room list success with members`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      }) 

      it(`get room list success and not login`, function(done) {

        let specialIdA
        const { model } = mockCreateSpecial({
          name: COMMON_API,
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId,
          glance: [
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            },
            {
              _id: ObjectId('571094e2976aeb1df982ad4e'),
              timestamps: Date.now()
            }
          ]
        })

        model.save()
        .then(data => {
          specialIdA = data._id 
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            sort: 'hot_1'
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            const indexThan = target.list.findIndex(item => specialIdA.equals(item._id))
            const indexLess = target.list.findIndex(item => specialId.equals(item._id))
            expect(indexThan > indexLess).to.be.true
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })  

    })

  })

  describe(`${COMMON_API} post room test`, function() {
      
    describe(`${COMMON_API} post room success test`, function() {

      const nameNoValid = COMMON_API + 'no-valid'
      const nameHaveValid = COMMON_API + 'have-valid'

      after(function(done) {
        SpecialModel.find({
          name: { $in: [ nameNoValid, nameHaveValid ] }
        })
        .select({
          _id: 1,
          valid: 1,
          name: 1
        })
        .exec()
        .then(data => {
          expect(data).to.be.a('array')
          expect(data.length >= 2).to.be.true
          const target = data.find(item => item.name == nameHaveValid)
          expect(!!target).to.be.true
          expect(target.valid).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops', err)
          done(err)
        })
      })
      
      it(`post room success`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId.toString(),
          name: nameNoValid,
          description: COMMON_API
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post room success and post text`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId.toString(),
          name: nameHaveValid,
          description: COMMON_API,
          valid: true
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post room success and post media`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId.toString(),
          name: nameHaveValid,
          description: COMMON_API,
          valid: true
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post room success and point_to user`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          poster: imageId.toString(),
          name: nameNoValid,
          description: COMMON_API
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`${COMMON_API} post room fail test`, function() {

      it(`post the message fail becuase lack of the params _id`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-1',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            null
          ],
          poster: imageId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase the params of _id is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-1',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            null
          ],
          poster: imageId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase the params of media conent is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-2',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId
          ],
          poster: imageId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase lack of the params of content`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-2',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId
          ],
          poster: imageId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase the params of type is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-3',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId,
          ],
          poster: imageId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase lack of the params of type`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-3',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId,
          ],
          poster: imageId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase the member is not exists`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-3',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId,
          ],
          poster: imageId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail becuase the member is not int the room`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API + 'post-3',
          description: COMMON_API,
          movie: [
            movieAId,
            movieBId,
            movieCId,
          ],
          poster: imageId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

  describe(`${COMMON_API} put room test`, function() {
      
    describe(`${COMMON_API} put room success test`, function() {

      let newSpecial = COMMON_API + 'new-special'

      after(function(done) {
        SpecialModel.findOne({
          name: newSpecial,
          valid: true,
        })
        .select({
          _id: 1,
          movie: 1,
        })
        .exec()
        .then(data => {
          expect(!!data && !!data._doc).to.be.true
          expect(data._doc.movie.length).to.be.equal(4)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`put the room success`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: specialId.toString(),
          name: newSpecial,
          movie: [
            movieAId,
            movieBId,
            movieCId,
            movieAId
          ],
          valid: true
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`${COMMON_API} put room fail test`, function() {

      let newName = COMMON_API + 'new-name'

      after(function(done) {
        SpecialModel.findOne({
          $or: [
            {
              description: ''
            },
            {
              name: ''
            },
            {
              movie: [
                movieAId,
                movieBId
              ],
            },
            {
              movie: [
                movieAId,
                movieBId,
                null
              ],
            }
          ]
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          expect(!!data && !!data._doc).to.be.false
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`put the room fail because the id is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: specialId.toString().slice(1),
          name: newName
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`put the room fail because lack of the id`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: specialId.toString().slice(1),
          name: newName
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

  describe(`${COMMON_API} delete room test`, function() {
      
    describe(`${COMMON_API} delete room success test`, function() {

      let specialId1
      let specialId2 
      before(function(done) {
        const { model: model1 } = mockCreateSpecial({
          name: COMMON_API + 'delete-1',
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          description: COMMON_API,
          origin: userInfo,
        })
        const { model: model2 } = mockCreateSpecial({
          name: COMMON_API + 'delete-2',
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          description: COMMON_API,
          origin: userInfo,
        })
        Promise.all([
          model1.save(),
          model2.save()
        ])
        .then(([special1, special2]) => {
          specialId1 = special1._id 
          specialId2 = special2._id
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      after(function(done) {
        SpecialModel.find({
          _id: { $in: [ specialId1, specialId2 ] }
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          expect(data.length).to.be.eq(0)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`delete the message success and dependence room id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${specialId1.toString()}, ${specialId2.toString()}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`delete the message success and dependence meessage id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${specialId1.toString()}, ${specialId2.toString()}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`${COMMON_API} delete room fail test`, function() {

      let specialId 
      before(function(done) {
        const { model } = mockCreateSpecial({
          name: COMMON_API + 'delete-3',
          movie: [
            movieAId,
            movieBId,
            movieCId
          ],
          description: COMMON_API,
          origin: userInfo,
        })
        model.save()
        .then(data => {
          specialId = data._id 
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`delete the message fail because the id is not valid`, function(done) {
        const id = specialId.toString()
        Request
        .delete(COMMON_API)
        .query({
          _id: `${Math.floor(( +id[0] + 1 ) % 10)}${id.slice(1)}`
        })
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

      it(`delete the message fail because lack of the id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: specialId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

})