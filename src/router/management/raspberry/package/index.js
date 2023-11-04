const Router = require("@koa/router");
const {
  dealErr,
  Params,
  responseDataDeal,
  RaspberryModel,
  notFound,
} = require("@src/utils");
const {
  Types: { ObjectId },
} = require("mongoose");
const { isFolderExist, removePackage, updatePackageFolder, createPackage } = require("./utils");

const router = new Router();

router
  .post("/build", async (ctx) => {
    //参数验证
    const check = Params.body(ctx, {
      name: "_id",
      validator: [(data) => ObjectId.isValid(data)],
    });
    if (check) return;

    const [_id] = Params.sanitizers(ctx.request.body, {
      name: "_id",
      sanitizers: [(data) => ObjectId(data)],
    });
    const { wait } = ctx.request.body

    const data = await RaspberryModel.findOne({
      _id,
    })
      .select({
        folder: 1,
      })
      .exec()
      .then(notFound)
      .then(async (data) => {
        removePackage(data.folder);
        if(wait) {
          await createPackage(url, folder, true);
        }else {
          createPackage(url, folder);
        }

        return {
          data: {
            data: _id.toString(),
          },
        };
      })
      .catch(dealErr(ctx));

    responseDataDeal({
      ctx,
      data,
      needCache: false,
    });
  })
  .get("/", async (ctx) => {
    const data = await RaspberryModel.aggregate([
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            create_user_id: "$user",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$create_user_id"],
                },
              },
            },
            {
              $lookup: {
                from: "images",
                as: "avatar",
                foreignField: "_id",
                localField: "avatar",
              },
            },
            {
              $unwind: {
                path: "$avatar",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          url: 1,
          user: {
            username: "$user.username",
            avatar: "$user.avatar.src",
            _id: "$user._id",
          },
          folder: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
      .then(data => {

        return {
          data: {
            list: data,
          },
        };
      })
      .catch(dealErr(ctx));

    responseDataDeal({
      ctx,
      data,
    });
  })
  .post("/", async (ctx) => {
    //参数验证
    const check = Params.body(
      ctx,
      {
        name: "name",
        validator: [
          (data) => {
            return typeof data === "string" && data.length > 0 && data.length < 60
          },
        ],
      },
      {
        name: "description",
        validator: [
          (data) => {
            return typeof data === "string" && data.length > 0 && data.length < 60
          }
        ],
      },
      {
        name: "url",
        validator: [(data) => {
          return typeof data === "string" && data.length > 0
        }],
      },
      {
        name: "folder",
        validator: [(data) => {
          return typeof data === "string" && !isFolderExist(data)
        }],
      }
    );
    if (check) return;

    const { name, description, url, folder, wait } = ctx.request.body;

    const data = await RaspberryModel.findOne({
      $or: [
        {
          name,
        },
        {
          url,
        },
      ],
    })
    .select({
      _id: 1,
      name: 1,
      url: 1
    })
    .exec()
      .then((data) => {
        if (data) return Promise.reject({ status: 403, errMsg: "exist" });
        const model = new RaspberryModel({
          name,
          description,
          url,
          folder,
        });
        return model.save();
      })
      .then(async (data) => {
        if (!data)
          return Promise.reject({ errMsg: "unknown error", status: 500 });

        if(wait) {
          await createPackage(url, folder, true);
        }else {
          createPackage(url, folder);
        }

        return {
          data: {
            data: data._id,
          },
        };
      })
      .catch(dealErr(ctx));

    responseDataDeal({
      ctx,
      data,
      needCache: false,
    });
  })
  .put("/", async (ctx) => {
    //参数验证
    const check = Params.body(
      ctx,
      {
        name: "_id",
        validator: [(data) => ObjectId.isValid(data)],
      },
      {
        name: "name",
        validator: [
          (data) =>
            typeof data === "string" && data.length > 0 && data.length < 60,
        ],
      },
      {
        name: "description",
        validator: [
          (data) =>
            typeof data === "string" && data.length > 0 && data.length < 60,
        ],
      },
      {
        name: "url",
        validator: [(data) => typeof data === "string" && data.length > 0],
      },
      {
        name: "folder",
        validator: [(data) => typeof data === "string" && data.length > 0],
      }
    );
    if (check) return;

    const { name, description, url, folder, wait } = ctx.request.body;
    const [_id] = Params.sanitizers(ctx.request.body, {
      name: "_id",
      sanitizers: [(data) => ObjectId(data)],
    });
    let actionType = ''

    const data = await RaspberryModel.findOne({
      $or: [
        {
          name,
        },
        {
          url,
        },
        {
          folder,
        },
        {
          _id,
        },
      ],
    })
      .select({
        _id: 1,
        name: 1,
        url: 1,
        folder: 1,
      })
      .exec()
      .then(notFound)
      .then(async (data) => {
        if (data._id.toString() !== _id.toString())
          return Promise.reject({ status: 403, errMsg: "exist" });

        // 地址不同则直接删掉重新下
        if (data.url !== url) {
          console.log(data.url, url, 2888)
          removePackage(data.folder);
          if(wait) {
            await createPackage(url, folder, true);
          }else {
            createPackage(url, folder);
          }
          actionType = 'rebuild'
        }
        // 目录不同就直接改个名字就行了
        else if (data.folder !== folder) {
          updatePackageFolder(folder, data.folder);
          actionType = 'rename'
        }else {
          actionType = 'database'
        }

        return RaspberryModel.updateOne(
          {
            _id,
          },
          {
            $set: {
              name,
              description,
              url,
              folder,
            },
          }
        );
      })
      .then((data) => {
        if (data && data.nModified == 0)
          return Promise.reject({ errMsg: "forbidden", status: 403 });

        return {
          data: {
            data: _id.toString(),
            actionType
          },
        };
      })
      .catch(dealErr(ctx));

    responseDataDeal({
      ctx,
      data,
      needCache: false,
    });
  })
  .delete("/", async (ctx) => {
    const check = Params.query(ctx, {
      name: "_id",
      validator: [(data) => ObjectId.isValid(data)],
    });

    if (check) return;

    const { _id } = ctx.query;
    let folder = "";

    const data = await RaspberryModel.findOne({
      _id: ObjectId(_id),
    })
      .select({ folder: 1 })
      .exec()
      .then(notFound)
      .then((data) => {
        folder = data.folder;
        return RaspberryModel.deleteOne({
          _id: ObjectId(_id),
        });
      })
      .then((data) => {
        if (data && data.deletedCount == 0)
          return Promise.reject({ errMsg: "forbidden", status: 403 });

        removePackage(folder);

        return {
          data: _id,
        };
      })
      .catch(dealErr(ctx));

    responseDataDeal({
      ctx,
      data,
      needCache: false,
    });
  });

module.exports = router;
