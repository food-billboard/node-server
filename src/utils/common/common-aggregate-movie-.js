
const commonAggregateMovie = [
  {
    $lookup: {
      from: 'images',
      as: 'images',
      foreignField: "_id",
      localField: "images"
    }
  },
  {
    $lookup: {
      from: 'images',
      as: 'poster',
      foreignField: "_id",
      localField: "poster"
    }
  },
  {
    $unwind: {
      path: "$poster",
      preserveNullAndEmptyArrays: true 
    }
  },
  {
    $lookup: {
      from: 'classifies',
      as: 'info.classify',
      foreignField: "_id",
      localField: "info.classify"
    }
  },
  {
    $lookup: {
      from: 'users',
      as: 'author',
      foreignField: "_id",
      localField: "author"
    }
  },
  {
    $unwind: {
      path: "$author",
      preserveNullAndEmptyArrays: true 
    }
  },
  {
    $lookup: {
      from: 'images',
      as: 'author.avatar',
      foreignField: "_id",
      localField: "author.avatar"
    }
  },
  {
    $unwind: {
      path: "$author.avatar",
      preserveNullAndEmptyArrays: true 
    }
  },
  {
    $addFields: {
      cal_rate: {
        $divide: [
          "$total_rate",
          "$rate_person"
        ]
      }
    }
  },
  {
    $project: {
      description: "$info.description",
      name: 1,
      poster: "$poster.src",
      _id: 1,
      rate: {
        $ifNull: [
          "$cal_rate",
          0
        ]
      },
      classify: {
        $map: {
          input: "$info.classify",
          as: "classify",
          in: {
            name: "$$classify.name"
          }
        }
      },
      publish_time: "$info.screen_time",
      hot: 1,
      author: {
        username: "$author.username",
        _id: "$author._id",
        avatar: "$author.avatar.src",
      },
      images: "$images.src"
    }
  }
]

module.exports = {
  commonAggregateMovie
}