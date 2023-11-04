require("module-alias/register");
const { expect } = require("chai");
const fs = require("fs-extra");
const path = require("path");
const { pick } = require("lodash");
const {
  Types: { ObjectId },
} = require("mongoose");
// const {
//   removePackage,
//   createPackage,
// } = require("@src/router/management/raspberry/package/utils");
const {
  UserModel,
  RaspberryModel,
  FRONT_END_PACKAGE_PATH,
} = require("@src/utils");
const {
  Request,
  commonValidate,
  mockCreateUser,
  parseResponse,
  mockCreateRaspberryPackage,
} = require("@test/utils");

const COMMON_API = "/api/manage/raspberry/package";
const COMMON_FOLDER = COMMON_API.split("/").join("");
const PACKAGE_URL = "git@github.com:food-billboard/tool-box.git";
const TEMPLATE_PACKAGE_FOLDER = path.join(FRONT_END_PACKAGE_PATH, "template");

function responseExpect(res, validate = []) {
  const {
    res: {
      data: { list },
    },
  } = res;

  expect(list).to.be.a("array");

  list.forEach((item) => {
    expect(item)
      .to.be.a("object")
      .and.that.include.any.keys(
        "_id",
        "name",
        "user",
        "folder",
        "description",
        "url",
        "createdAt",
        "updatedAt"
      );
    commonValidate.objectId(item._id);
    commonValidate.string(item.name);
    commonValidate.string(item.description);
    commonValidate.string(item.folder);
    commonValidate.string(item.url);
    commonValidate.date(item.createdAt);
    commonValidate.date(item.updatedAt);
    expect(item.user)
      .to.be.a("object")
      .and.that.includes.any.keys("username", "avatar", "_id");
    commonValidate.string(item.user.username);
    commonValidate.poster(item.user.poster);
    commonValidate.objectId(item.user._id);
  });

  if (Array.isArray(validate)) {
    validate.forEach((valid) => {
      typeof valid == "function" && valid(res.res);
    });
  } else if (typeof validate === "function") {
    validate(res.res);
  }
}

describe(`${COMMON_API} test`, () => {
  let userInfo;
  let selfToken;
  let packageData;
  let getToken;

  before(function (done) {
    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    });

    getToken = signToken;

    model
      .save()
      .then((user) => {
        userInfo = user;
        selfToken = getToken(userInfo._id);
        const { model } = mockCreateRaspberryPackage({
          name: COMMON_API,
          user: userInfo._id,
          folder: COMMON_FOLDER,
        });
        return model.save();
      })
      .then((data) => {
        packageData = data;
        return fs.mkdir(path.join(FRONT_END_PACKAGE_PATH, COMMON_FOLDER));
      })
      .then((_) => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  after(function (done) {
    Promise.all([
      RaspberryModel.deleteMany({
        $or: [
          {
            name: {
              $regex: COMMON_API,
              $options: 'ig'
            }
          },
          {
            folder: {
              $regex: COMMON_FOLDER,
              $options: 'ig'
            }
          }
        ]
      }),
      UserModel.deleteMany({
        username: COMMON_API,
      }),
      fs.readdir(FRONT_END_PACKAGE_PATH)
      .then(data => {
        return Promise.all(data.map(item => {
          if(item.startsWith(COMMON_FOLDER)) {
            return fs.rmdir(path.join(FRONT_END_PACKAGE_PATH, item))
          }
        }))
      }),
      fs.existsSync(TEMPLATE_PACKAGE_FOLDER) && fs.rmdir(TEMPLATE_PACKAGE_FOLDER),
    ])
      .then((_) => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  describe(`get the raspberry package list success test -> ${COMMON_API}`, function () {
    it(`get the raspberry package list success`, function (done) {
      Request.get(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then(function (res) {
          let obj = parseResponse(res);
          responseExpect(obj, (target) => {
            const { total, list } = target.data;
            expect(total).to.be.not.equals(0);
            expect(list.some((item) => item._id === packageData._id.toString()))
              .to.be.true;
          });
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe(`post the raspberry package success test -> ${COMMON_API}`, function () {
    it(`post the raspberry package success`, function (done) {
      const data = {
        name: COMMON_API + Math.random(),
        description: "1111",
        folder: COMMON_FOLDER + Date.now(),
        url: PACKAGE_URL,
      };

      let isError = false;

      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...data,
          wait: true,
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then(function (res) {
          return Promise.all([
            RaspberryModel.findOne(data)
              .select({
                _id: 1,
              })
              .exec(),
            fs.exists(path.join(FRONT_END_PACKAGE_PATH, data.folder)),
          ]);
        })
        .then((result) => {
          isError = !result.every(Boolean);
          if (isError) {
            return Promise.reject("post success error");
          } else {
            return Promise.all([
              RaspberryModel.deleteOne({ _id: ObjectId(result[0]._id) }),
              fs.rmdir(path.join(FRONT_END_PACKAGE_PATH, data.folder)),
            ]);
          }
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe(`put the raspberry package success test -> ${COMMON_API}`, function () {
    let packageData;
    const folder = COMMON_FOLDER + Math.random();
    let newUrl = '2222' + Date.now() + Math.random()

    before(function (done) {
      const { model } = mockCreateRaspberryPackage({
        name: COMMON_API + Math.random(),
        user: userInfo._id,
        folder,
        url: '2222' + Date.now()
      });

      model
        .save()
        .then((data) => {
          packageData = data;
          return fs.mkdir(path.join(FRONT_END_PACKAGE_PATH, folder));
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`put the raspberry package description success and not rebuild`, function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...pick(packageData, ["name", "url", "folder"]),
          _id: packageData._id.toString(),
          description: "2222222",
          wait: true,
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then(function (res) {
          let obj = parseResponse(res);
          const {
            res: {
              data: { actionType },
            },
          } = obj;
          expect(actionType).to.be.equals("database");
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`put the raspberry package url success and rebuild`, function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...pick(packageData, ["name", "description", "folder"]),
          _id: packageData._id.toString(),
          url: newUrl,
          wait: true,
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then(function (res) {
          let obj = parseResponse(res);
          const {
            res: {
              data: { actionType },
            },
          } = obj;
          expect(actionType).to.be.equals("rebuild");
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`put the raspberry package folder success and rename`, function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...pick(packageData, ["name", "description"]),
          _id: packageData._id.toString(),
          folder: COMMON_FOLDER + Math.random(),
          url: newUrl,
          wait: true,
        })
        .expect(200)
        .expect("Content-Type", /json/)
        .then(function (res) {
          let obj = parseResponse(res);
          const {
            res: {
              data: { actionType },
            },
          } = obj;
          expect(actionType).to.be.equals("rename");
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe("delete raspberry package success", function () {
    it(`delete raspberry package success`, function (done) {
      const { model } = mockCreateRaspberryPackage({
        name: COMMON_API + Math.random(),
        user: userInfo._id,
        folder: COMMON_FOLDER + Math.random(),
        url: '22222222' + Date.now()
      });
      model
        .save()
        .then((data) => {
          return Request.delete(COMMON_API)
            .set({
              Accept: "application/json",
              Authorization: `Basic ${selfToken}`,
            })
            .query({
              _id: data._id.toString(),
            })
            .expect(200)
            .expect("Content-Type", /json/);
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe(`post the raspberry package fail test -> ${COMMON_API}`, function () {
    const data = {
      name: COMMON_API + Math.random(),
      description: "1111",
      folder: COMMON_FOLDER + Date.now(),
      url: PACKAGE_URL,
    };

    it(`post the raspberry package fail because the name is exists`, function (done) {

      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...data,
          name: COMMON_API,
          wait: true,
        })
        .expect(403)
        .expect("Content-Type", /json/)
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`post the raspberry package fail because the folder is exists`, function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...data,
          wait: true,
          folder: COMMON_FOLDER
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`post the raspberry package fail because the url is exists`, function (done) {
      Request.post(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...data,
          wait: true,
          url: packageData.url
        })
        .expect(403)
        .expect("Content-Type", /json/)
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe(`put the raspberry package fail test -> ${COMMON_API}`, function () {

    let addPackageData;
    const folder = COMMON_FOLDER + Math.random();

    before(function (done) {
      const { model } = mockCreateRaspberryPackage({
        name: COMMON_API + Math.random(),
        user: userInfo._id,
        folder,
      });

      model
        .save()
        .then((data) => {
          addPackageData = data;
          return fs.mkdir(path.join(FRONT_END_PACKAGE_PATH, folder));
        })
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`put the raspberry package fail because the id is not exists`, function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...pick(packageData, ["name", "url", "folder", "description"]),
          _id: addPackageData._id.toString().split('').sort().join(''),
          wait: true,
        })
        .expect(403)
        .expect("Content-Type", /json/)
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`put the raspberry package fail because the name is exists`, function (done) {
      Request.put(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .send({
          ...pick(packageData, ["description", "name"]),
          _id: addPackageData._id.toString(),
          folder: '3333',
          url: '4444',
          wait: true,
        })
        .expect(403)
        .expect("Content-Type", /json/)
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`put the raspberry package fail because the folder is exists`, function (done) {
      Request.put(COMMON_API)
      .set({
        Accept: "application/json",
        Authorization: `Basic ${selfToken}`,
      })
      .send({
        ...pick(packageData, ["description", "folder"]),
        _id: addPackageData._id.toString(),
        name: '3333',
        url: '4444',
        wait: true,
      })
      .expect(403)
      .expect("Content-Type", /json/)
      .then((_) => {
        done();
      })
      .catch((err) => {
        done(err);
      });
    });

    it(`put the raspberry package fail because the url is exists`, function (done) {
      Request.put(COMMON_API)
      .set({
        Accept: "application/json",
        Authorization: `Basic ${selfToken}`,
      })
      .send({
        ...pick(packageData, ["description", "url"]),
        _id: addPackageData._id.toString(),
        name: '3333',
        folder: '4444',
        wait: true,
      })
      .expect(403)
      .expect("Content-Type", /json/)
      .then((_) => {
        done();
      })
      .catch((err) => {
        done(err);
      });
    });
  });

  describe(`delete the raspberry package fail test -> ${COMMON_API}`, function () {
    it(`delete raspberry package fail because the id is not valid`, function (done) {
      Request.delete(COMMON_API)
        .set({
          Accept: "application/json",
          Authorization: `Basic ${selfToken}`,
        })
        .query({
          _id: packageData._id.toString().slice(1),
        })
        .expect(400)
        .expect("Content-Type", /json/)
        .then((_) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it(`delete raspberry package fail because the id is not found`, function (done) {
      const id = packageData._id.toString();

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
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
