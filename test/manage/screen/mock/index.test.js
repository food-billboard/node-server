require("module-alias/register")
const { expect } = require("chai")
const {
  Types: { ObjectId },
} = require("mongoose")
const { ScreenMockModel, UserModel } = require("@src/utils")
const {
  Request,
  mockCreateScreenMock,
  deepParseResponse,
  mockCreateUser,
  parseResponse,
  commonValidate
} = require("@test/utils")

const COMMON_API = "/api/manage/screen/mock"

function findData(res) {
  const obj = deepParseResponse(res)
  const { _id } = obj
  return ScreenMockModel.findOne({
    _id: ObjectId(_id),
  })
    .select({
      mock_data: 1,
    })
    .exec()
    .then((data) => {
      const json = JSON.parse(data.mock_data)
      expect(json).to.be.a("array")
      expect(json.length > 0).to.be.true
      return json 
    })
}

function responseExpect(res, validate = []) {
  const {
    res: { data: { list, total } },
  } = res

  commonValidate.number(total)
  expect(list).to.be.a("array")

  list.forEach((item) => {
    expect(item)
      .to.be.a("object")
      .and.that.include.any.keys(
        "_id",
        "data_kind",
        "user",
        "description",
        "config",
        "createdAt",
        "updatedAt"
      )
    commonValidate.objectId(item._id)
    commonValidate.string(item.data_kind)
    item.description && commonValidate.string(item.description)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.user)
      .to.be.a("object")
      .and.that.includes.any.keys("username", "avatar", "_id")
    commonValidate.string(item.user.username)
    commonValidate.poster(item.user.poster)
    commonValidate.objectId(item.user._id)
    expect(item.config).to.be.a("object")
  })

  if (Array.isArray(validate)) {
    validate.forEach((valid) => {
      typeof valid == "function" && valid(res.res)
    })
  } else if (typeof validate === "function") {
    validate(res.res)
  }
}

describe(`${COMMON_API} test`, () => {
  let mockId
  let userInfo
  let selfToken
  let getToken

  before(function (done) {


    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    }, {
      expiresIn: '10s'
    })

    getToken = signToken

    model.save()
      .then(user => {
        userInfo = user 
        selfToken = getToken(userInfo._id)
        const { model: mock } = mockCreateScreenMock({
          data_kind: COMMON_API,
          config_type: "text",
          user: user._id 
        })
        return mock.save() 
      })
      .then(data => {
        mockId = data._id
      })
      .then((_) => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  after(function (done) {
    Promise.all([
      ScreenMockModel.deleteMany({
        data_kind: COMMON_API,
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
    ])
      .then((_) => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  describe(`get the screen mock data success test -> ${COMMON_API}`, function () {
    it(`get the screen mock data success with content`, function (done) {
      Request.get(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .query({
          content: COMMON_API.slice(0, 3),
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { total, list } = target.data 
            expect(total).to.be.not.equals(0)
            expect(list.some((item) => item._id === mockId.toString())).to.be
              .true
          })
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it(`get the screen mock data success with date_type`, function (done) {
      Request.get(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .query({
          date_type: "text",
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { total, list } = target.data 
            expect(total).to.be.not.equals(0)
            expect(list.some((item) => item._id === mockId.toString())).to.be
              .true
          })
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`delete the screen mock data success test -> ${COMMON_API}`, function () {
    it("delete the screen mock data success", function (done) {
      const { model } = mockCreateScreenMock({
        data_kind: COMMON_API,
        config_type: "text",
      })
      let mockId

      model
        .save()
        .then((data) => {
          mockId = data._id
          return Request.delete(COMMON_API)
            .set({
              Accept: "application/json",
              Authorization: `Basic ${selfToken}`,
            })
            .query({
              _id: mockId.toString(),
            })
            .expect(200)
            .expect("Content-Type", /json/)
        })
        .then((data) => {
          return ScreenMockModel.findOne({
            _id: mockId,
          })
            .exec()
            .then((data) => {
              expect(!!data).to.be.false
            })
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`delete the screen mock data fail test -> ${COMMON_API}`, function () {
    it("delete the screen mock data fail because the id is not found", function (done) {
      const id = mockId.toString()

      Request.delete(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .query({
          _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`,
        })
        .expect(404)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("delete the screen mock data fail because the id is not valid", function (done) {
      Request.delete(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .query({
          _id: mockId.toString().slice(1),
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("delete the screen mock data fail because lack of the id", function (done) {
      Request.delete(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`post the screen mock data success test -> ${COMMON_API}`, function () {
    it("post the screen mock data success with color", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "color",
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(/#.{6}/.test(data[0])).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with text", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "text",
          config: {
            text: {
              min: 3,
              max: 20,
              language_type: "chinese",
              text_type: "title",
            }
          },
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return (
                item.length >= 3 && item.length <= 20 && !/[a-zA-Z]+/.test(item)
              )
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with name", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "name",
          config: {
            name: {
              language_type: "chinese",
              name_type: "first-last",
            }
          },
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return (
                item.length >= 2
              )
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with date", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "date",
          config: {
            date: {
              date_type: "date",
              format: "yyyy_MM_dd",
            }
          },
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return (
                item.length === 10 && /[0-9]{4}_[0-9]{2}_[0-9]{2}/.test(item)
              )
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with address", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "address",
          config: {
            address: {
              address_type: "city",
              prefix: false 
            }
          },
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return typeof item === 'string'
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with iamge", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "image",
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return typeof item === 'string'
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with web", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "web",
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return typeof item === 'string'
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with number", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "number",
          config: {
            number: {
              min: 20,
              max: 100,
              decimal: true,
              dmin: 1,
              dmax: 10 
            }
          },
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              const point = item.toString().split('.')[1]
              return typeof item === 'number' && item >= 20 && item <= 101 && point.length >= 1 && point.length <= 10
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("post the screen mock data success with boolean", function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "boolean",
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((res) => {
          return findData(res)
        })
        .then((data) => {
          expect(
            data.every((item) => {
              return typeof item === 'boolean'
            })
          ).to.be.true
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`post the screen mock data fail test -> ${COMMON_API}`, function () {
    it(`post the screen mock data fail because lack of the data_kind`, function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          config_type: "text",
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it(`post the screen mock data fail because lack of the config_type`, function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it(`post the screen mock data fail because the config_type is not valid`, function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          data_kind: COMMON_API,
          config_type: "111",
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`put the screen mock data success test -> ${COMMON_API}`, function () {
    it("put the screen mock data success", function (done) {
      Request
        .put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          _id: mockId.toString(),
          data_kind: COMMON_API,
          description: COMMON_API,
          config_type: "text",
          config: {
            min: 3,
            max: 20,
            language_type: "chinese",
            text_type: "title",
          },
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then((data) => {
          return ScreenMockModel.findOne({
            _id: mockId,
          })
            .select({
              description: 1,
            })
            .exec()
            .then(data => {
              expect(data.description).to.be.equal(COMMON_API)
            })
        })
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`put the screen mock data fail test -> ${COMMON_API}`, function () {

    const commonParams = {
      data_kind: COMMON_API,
      description: COMMON_API,
      config_type: "text",
      config: {
        min: 3,
        max: 20,
        language_type: "chinese",
        text_type: "title",
      },
    }

    it("put the screen mock data fail because the id is not found", function (done) {

      Request
        .put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          _id: `8f63270f005f1c1a0d9448ca`,
          ...commonParams
        })
        .expect(404)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("put the screen mock data fail because the id is not valid", function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          _id: mockId.toString().slice(1),
          ...commonParams
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })

    it("put the screen mock data fail because lack of the id", function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send(commonParams)
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })
})
