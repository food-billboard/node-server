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

    const [_id] = sanitizersParams(ctx, {
      name: "_id",
      sanitizers: [(data) => ObjectId(data)],
    });

    await RaspberryModel.findOne({
      _id,
    })
      .select({
        folder: 1,
      })
      .then(notFound)
      .then((data) => {
        removePackage(data.folder);
        createPackage(url, folder);

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
    await RaspberryModel.aggregate([
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
      .then(([total_data, data]) => {
        const [total = { total: 0 }] = total_data;

        return {
          data: {
            list: data,
            total: total.total,
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
        type: ["isEmpty"],
        validator: [
          (data) =>
            typeof data === "string" && data.length > 0 && data.length < 40,
        ],
      },
      {
        name: "description",
        type: ["isEmpty"],
        validator: [
          (data) =>
            typeof data === "string" && data.length > 0 && data.length < 60,
        ],
      },
      {
        name: "url",
        type: ["isEmpty"],
        validator: [(data) => typeof data === "string" && data.length > 0],
      },
      {
        name: "folder",
        type: ["isEmpty"],
        validator: [(data) => typeof data === "string" && isFolderExist(data)],
      }
    );
    if (check) return;

    const { name, description, url, folder } = ctx.request.body;

    await RaspberryModel.findOne({
      $or: [
        {
          name,
        },
        {
          url,
        },
      ],
    })
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
      .then((data) => {
        if (!data)
          return Promise.reject({ errMsg: "unknown error", status: 500 });

        createPackage(url, folder);

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
        type: ["isEmpty"],
        validator: [
          (data) =>
            typeof data === "string" && data.length > 0 && data.length < 40,
        ],
      },
      {
        name: "description",
        type: ["isEmpty"],
        validator: [
          (data) =>
            typeof data === "string" && data.length > 0 && data.length < 60,
        ],
      },
      {
        name: "url",
        type: ["isEmpty"],
        validator: [(data) => typeof data === "string" && data.length > 0],
      },
      {
        name: "folder",
        type: ["isEmpty"],
        validator: [(data) => typeof data === "string" && data.length > 0],
      }
    );
    if (check) return;

    const { name, description, url, folder } = ctx.request.body;
    const [_id] = sanitizersParams(ctx, {
      name: "_id",
      sanitizers: [(data) => ObjectId(data)],
    });

    await RaspberryModel.findOne({
      $or: [
        {
          name,
        },
        {
          url,
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
      .then(notFound)
      .then((data) => {
        if (data._id.toString() !== _id.toString())
          return Promise.reject({ status: 403, errMsg: "exist" });

        // 地址不同则直接删掉重新下
        if (data.url !== url) {
          removePackage(data.folder);
          createPackage(url, folder);
        }
        // 目录不同就直接改个名字就行了
        else if (data.folder !== folder) {
          updatePackageFolder(folder, data.folder);
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
      .then((data) => {
        folder = data.folder;
        return RaspberryModel.deleteOne({
          _id: ObjectId(_id),
        });
      })
      .then((data) => {
        if (data && data.deletedCount == 0)
          return Promise.reject({ errMsg: "forbidden", status: 403 });

        const success = removePackage(folder);
        if (!success)
          return Promise.reject({ errMsg: "notFound", status: 404 });

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
