require('module-alias/register')
const { expect } = require('chai')
const { TagModel, CommentModel, MovieModel } = require('@src/utils')
const { mockCreateTag, mockCreateComment, mockCreateMovie } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/tag")

const SCHEDULE_PREFIX = "schedule of no movie tag test"

describe(SCHEDULE_PREFIX, function() {

  let tagId 
  let commentId 
  let movieId 

  before(function(done) {

    const { model: tag } = mockCreateTag({
      text: SCHEDULE_PREFIX
    })

    const { model: comment } = mockCreateComment({
      content: {
        text: SCHEDULE_PREFIX
      },
      source_type: "movie"
    })

    Promise.all([
      tag.save(),
      comment.save()
    ])
    .then(([tag, comment]) => {
      tagId = tag._id 
      commentId = comment._id 
      const { model } = mockCreateMovie({
        name: SCHEDULE_PREFIX,
        tag: [
          tagId
        ],
        comment: [
          commentId
        ]
      })
      return model.save()
    })
    .then(data => {
      movieId = data._id 
      return Promise.all([
        TagModel.updateOne({
          _id: tagId
        }, {
          $set: {
            source: movieId
          }
        }),
        CommentModel.updateOne({
          _id: commentId
        }, {
          $set: {
            source: movieId
          }
        })
      ])
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {
    Promise.all([
      MovieModel.deleteMany({
        name: SCHEDULE_PREFIX
      }),
      TagModel.deleteMany({
        source: movieId
      }),
      CommentModel.deleteMany({
        "content.text": SCHEDULE_PREFIX
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`update movie tag data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return MovieModel.findOne({
        name: SCHEDULE_PREFIX,
      })
      .select({
        _id: 1,
        tag: 1,
      })
      .exec()
    })
    .then(data => {
      expect(!!data).to.be.true
      const { tag } = data 
      expect(tag.some(item => tagId.equals(item))).to.be.false
      return TagModel.find({
        _id: {
          $in: tag
        }
      })
      .select({
        text: 1
      })
      .exec()
    })
    .then(data => {
      expect(data.every(item => {
        const { text } = item 
        return SCHEDULE_PREFIX.includes(text)
      })).to.be.true
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

