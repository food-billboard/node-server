const Day = require('dayjs')
const mongoose = require("mongoose")
const { Schema, model } = mongoose
const ObjectId = mongoose.Types.ObjectId

function getMill(time) {
  return Day(time).valueOf()
}

function setMill(time) {
  return Day(time).toISOString('millisecond')
}

const defaultConfig = {
  strict: true,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
}

//user
const UserSchema = new Schema({
	mobile: {
    type: Number,
    unique: true,
    set: (v) => Number(v),
    required: function() {
      return /^1[3456789]\d{9}$/g.test(this.mob)
    },
  },
	password: {
    type: String,
    required: true
  },
	username: {
    type: String,
    default: '默认名称'
  },
	avatar: {
    default: ObjectId('5edb3c7b4f88da14ca419e61'),
    type: ObjectId,
    ref: 'image'
  },
	hot: {
    type: Number,
    default: 0,
    min: 0,
  },
  fans: [{
    type: ObjectId,
    ref: 'user',
  }],
  attentions: [{
    type: ObjectId,
    ref: 'user',
  }],
  issue: [{
    type: ObjectId,
    ref: 'movie'
  }],
  glance: [{
    type: ObjectId,
    ref: 'movie'
  }],
  comment: [{
    type: ObjectId,
    ref: 'comment',
  }],
  store: [{
    type: ObjectId,
    ref: 'movie'
  }],
  rate: [{
    _id: {
      type: ObjectId,
      required: true,
      ref: 'movie'
    },
    rate: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
      set: function(rate) {
        if(rate < 0) return 0
        if(rate > 10) return 10
        return rate
      }
    }
  }],
  allow_many: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['SIGNIN', 'SIGNOUT', 'FREEZE'],
    trim: true,
    uppercase: true,
    default: "SIGNOUT"
  }
}, {
  ...defaultConfig
})

//global
const GlobalSchema = new Schema({
  notice: {
    type: String,
    required: true
  },
  info: {
    type: String,
    required: true
  },
}, {
  ...defaultConfig
})

//room
const RoomSchema = new Schema({
  type:  {
    type: String,
    required: true,
    enum: [ "GROUP_CHAT", "CHAT", "SYSTEM" ],
    uppercase: true,
    trim: true,
    default: "CHAT"
  },
  origin: {
    type: Boolean,
    default: false,
    required: true,
  },
  info: {
    avatar: {
      type: ObjectId,
      ref: 'image',
      default: ObjectId('5edb3c7b4f88da14ca419e61')
    },
    name: {
      type: String,
      default: '默认名称'
    },
    description: {
      type: String,
      default: '默认介绍'
    }
  },
  members: [
    {
      user: {
        type: ObjectId,
        required: true,
        ref: 'user'
      },
      sid: {
        type: String,
      },
      status: {
        enum: [ "ONLINE", "OFFLINE" ],
        uppercase: true,
        type: String,
        trim: true,
        required: true
      },
      message: [{
        _id: {
          type: ObjectId,
          ref: 'message',
          required: true
        },
        readed: {
          type: Boolean,
          default: false
        }
      }]
    }
  ],
  message: [{
    _id: {
      type: ObjectId,
      ref: 'message',
      get: function(v) {
        if(this.origin === true && this.type === 'SYSTEM') return v
        return null
      },
      set: function(v) {
        if(this.origin === true && this.type === 'SYSTEM') return v
        return null
      }
    }
  }]
}, {
  ...defaultConfig
})

const MessageSchema = new Schema({
  user_info: {
    type: {
      required: true,
      enum: [ "__ADMIN__", "USER" ],
      type: String,
      default: 'USER',
      trim: true,
      uppercase: true,
    },
    _id: {
      type: ObjectId,
      ref: 'user',
      required: true,
    },
  },
  point_to: {
    type: ObjectId,
    ref: 'user',
  },
  type: {
    type: String,
    uppercase: true,
    trim: true,
    enum: [ "IMAGE", "AUDIO", "TEXT", "VIDEO" ],
    required: true
  },
  room: {
    type: ObjectId,
    ref: 'room',
    required: true
  },
  content: {
    text: {
      type: String
    },
    video: {
      type: ObjectId,
      ref: 'video'
    },
    image: {
      type: ObjectId,
      ref: 'image'
    }
  },
}, {
  ...defaultConfig
})

const MovieSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  info: {
    name: {
      type: String,
      required: true,
    },
    another_name: [{
      type: String,
    }],
    description: {
      type: String,
      default: '默认介绍'
    },
    actor: [{
      type: ObjectId,
      ref: 'actor'
    }],
    director: [{
      type: ObjectId,
      ref: 'director'
    }],
    district: [{
      type: ObjectId,
      ref: 'district'
    }],
    classify: [{
      type: ObjectId,
      ref: 'classify'
    }],
    screen_time: {
      type: Date,
      default: Date.now(),
      get: getMill,
      set: setMill,
    },
    language: [{
      type: ObjectId,
      ref: 'language'
    }]
  },
  rest: {
    actor: [String],
    director: [String],
    district: [String],
    classify: [String],
    language: [String]
  },
  video: {
    type: ObjectId,
    ref: 'video'
  },
  images: [{
    type: ObjectId,
    ref: 'image'
  }],
  poster: {
    type: ObjectId,
    ref: 'image'
  },
  tag: [{
    type: ObjectId,
    ref: 'tag'
  }],
  comment: [{
    type: ObjectId,
    ref: 'comment'
  }],
  author: {
    type: ObjectId,
    ref: 'user',
    required: true,
  },
	glance: {
    type:Number,
    default: 0
  },
  author_description: {
    type: String,
    default: '默认描述',
  },
  author_rate: {
    type: Number,
    default: 0,
  },
	hot: {
    type: Number,
    default: 0,
  },
  rate_person: {
    type: Number,
    default: 0,
  },
	total_rate: {
    type: Number,
    default: 0,
  },
  source_type: {
    type: String,
    required: true,
    enum: [ 'ORIGIN', 'USER' ],
    trim: true,
    uppercase: true,
  },
  stauts: 
  {
    type: String,
    required: true,
    enum: [ 'VERIFY', 'COMPLETE' ],
    trim: true,
    uppercase: true,
  },
	related_to: [{
    film: {
      type: ObjectId,
      ref: 'movie',
      required: true
    },
    related_type: [{
      type: String,
      enum: [ "DIRECTOR", "ACTOR", "AUTHOR", "CLASSIFY" ],
      trim: true,
      uppercase: true,
      required: true,
    }]
  }],
	same_film: [{
    film: {
      type: ObjectId,
      ref: 'movie',
      required: true
    },
    same_type: {
      type: String,
      enum: [ "SERIES", "NAMESAKE" ],
      trim: true,
      uppercase: true,
      required: true
    }
	}]
}, {
  ...defaultConfig
})

const TagSchema = new Schema({
  text: {
    type: String,
    unique: true,
    default: '默认内容',
  },
  other: {}
}, {
  ...defaultConfig,
  minimize: false
})

const SpecialSchema = new Schema({
  movie: [{
    required: true,
    type: ObjectId,
    ref: 'movie'
  }],
  poster: {
    type: ObjectId,
    ref: 'image'
  },
  description: {
    type: String,
    default: '默认介绍'
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  ...defaultConfig
})

const ActorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  works: [{
    type: ObjectId,
    ref: 'movie'
  }],
  other: {
    another_name: {
      type: String,
    },
    avatar: {
      type: ObjectId,
      ref: 'image'
    }
  },
}, {
  ...defaultConfig,
  minimize: false
})

const DirectorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  works: [{
    type: ObjectId,
    ref: 'movie'
  }],
  other: {
    another_name: {
      type: String,
    },
    avatar: {
      type: ObjectId,
      ref: 'image'
    }
  },
}, {
  ...defaultConfig,
  minimize: false
})

const DistrictSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  other: {}
}, {
  ...defaultConfig,
  minimize: false
})

const SearchSchema = new Schema({
  key_word: {
    type: String,
    required: true,
    unique: true,
  },
	match_movies: [{
		movie: {
      type: ObjectId,
      ref: 'movie',
      required: true
    },
		field: String
	}],
	match_texts: [String],
  hot: {
    type: Number,
    default: 0,
  },
  other: {},
}, {
  ...defaultConfig,
  minimize: false
})

const CommentSchema = new Schema({
  source_type: {
    type: String,
    enum: ['movie', 'user'],
    required: true,
    trim: true,
  },
  source: {
    required: true,
    type: ObjectId,
    refPath: 'source_type'
  },
  user_info: {
    type: ObjectId,
    ref: 'user'
  },
	sub_comments: [{
    type: ObjectId,
    ref: 'comment',
  }],
  total_like: {
    type: Number,
    default: 0
  },
  like_person: [{
    type: ObjectId,
    ref: 'user'
  }],
  content: {
    text: {
      type: String
    },
    video: [
      {
        type: ObjectId,
        ref: 'video',
      } 
    ],
    image: [
      {
        type: ObjectId,
        ref: 'image'
      } 
    ]
  },
  comment_users: [{
    type: ObjectId,
    ref: 'user',
  }]
}, {
  ...defaultConfig
})

const RankSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  other: {},
  icon: {
    type: ObjectId,
    ref: 'image'
  },
  match_field: {
    type: String,
    enum: [ "GLANCE", 'AUTHOR_RATE', 'HOT', 'TOTAL_RATE', 'CLASSIFY' ],
    uppercase: true,
    get: function(v) {
      return v
    }
  },
  match: [{
    type: ObjectId,
    ref: 'movie'
  }],
  glance: {
    type: Number,
    default: 0
  }
}, {
  ...defaultConfig,
  minimize: false
})

const ClassifySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  other: {},
  icon: {
    type: ObjectId,
    ref: 'image'
  },
  match: [
    {
      type: ObjectId,
      ref: 'movie'
    }
  ],
  glance: {
    type: Number,
    default: 0
  }
}, {
  ...defaultConfig,
  minimize: false
})

const LanguageSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  other: {},
}, {
  ...defaultConfig,
  minimize: false
})

const VideoSchema = new Schema({
  name: String,
  src: {
    type: String,
    required: true
  },
  poster: {
    type: ObjectId,
    ref: 'image'
  },
  origin_type: {
    required: true,
    type: String,
    enum: [ "USER", "SYSTEM" ]
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  } 
}, {
  ...defaultConfig
})

const ImageSchema = new Schema({
  name: String,
  src: {
    type: String,
    required: true
  },
  origin_type: {
    required: true,
    type: String,
    enum: [ "USER", "SYSTEM" ]
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  } 
}, {
  ...defaultConfig
})

RoomSchema.pre("find", function() {
  this.populate({
    path: "info.avatar",
    select: {
      src: 1,
      _id: 0
    }
  })
})

SpecialSchema.pre("findOne", function() {
  if(this._fields.poster) {
    this.populate({
      path: 'poster',
      select: {
        src: 1,
        _id: 0
      }
    })
  }
})

RankSchema.pre("find", function() {
  if(this._fields.icon) {
    this.populate({
      path: 'icon',
      select: {
        src: 1,
        _id: 0
      }
    })
  }
})

MovieSchema.pre('findOne', function() {
  // if(this._fields.poster) {
    this.populate({
      path: 'poster',
      select: {
        src: 1,
        _id: 0
      }
    })
    .populate({
      path: 'images',
      select: {
        src: 1,
        _id: 0
      }
    })
    .populate({
      path: 'video',
      select: {
        src: 1,
        _id: 0
      }
    })
  // }
})

MovieSchema.pre('find', function() {
  const { _fields, paths } = this
  if(this._fields.poster) {
    this.populate({
      path: 'poster',
      select: {
        src: 1,
        _id: 0
      }
    })
  }
})

UserSchema.pre('find', function() {
  if(this._fields.avatar) {
    this.populate({
      path: 'avatar',
      select: {
        src: 1,
        _id: 0
      }
    })
  }
})
UserSchema.pre('findOne', function() {
  if(this._fields.avatar) {
    this.populate({
      path: 'avatar',
      select: {
        src: 1,
        _id: 0
      }
    })
  }
})

CommentSchema.pre('find', function() {
  // if(this._fields.content) {
    this.populate({
      path: 'content.image',
      select: {
        src: 1,
        _id: 0
      }
    })
    .populate({
      path: 'content.video',
      select: {
        src: 1,
        _id: 0
      }
    })
    .populate({
      path: 'user_info',
      select: {
        avatar: 1,
        username: 1
      }
    })
  // }
})

CommentSchema.pre('findOne', function() {
  // if(this._fields.content) {
    this.populate({
      path: 'content.image',
      select: {
        src: 1,
        _id: 0
      }
    })
    .populate({
      path: 'content.video',
      select: {
        src: 1,
        _id: 0
      }
    })
    .populate({
      path: 'user_info',
      select: {
        avatar: 1,
        username: 1
      }
    })
  // }
})

const UserModel = model('user', UserSchema)
const GlobalModel = model('global', GlobalSchema)
const RoomModel = model("room", RoomSchema)
const MessageModel = model('message', MessageSchema)
const MovieModel = model('movie', MovieSchema)
const TagModel = model('tag', TagSchema)
const SpecialModel = model('special', SpecialSchema)
const ActorModel = model('actor', ActorSchema)
const DirectorModel = model('director', DirectorSchema)
const DistrictModel = model('district', DistrictSchema)
const SearchModel = model('search', SearchSchema)
const CommentModel = model('comment', CommentSchema)
const RankModel = model('rank', RankSchema)
const ClassifyModel = model('classify', ClassifySchema)
const LanguageModel = model('language', LanguageSchema)
const VideoModel = model('video', VideoSchema)
const ImageModel = model('image', ImageSchema)

module.exports = {
  UserModel,
  GlobalModel,
  RoomModel,
  MessageModel,
  MovieModel,
  TagModel,
  SpecialModel,
  ActorModel,
  DirectorModel,
  DistrictModel,
  SearchModel,
  CommentModel,
  RankModel,
  ClassifyModel,
  LanguageModel,
  VideoModel,
  ImageModel,
  UserSchema,
  GlobalSchema,
  RoomSchema,
  MessageSchema,
  MovieSchema,
  TagSchema,
  SpecialSchema,
  ActorSchema,
  DirectorSchema,
  DistrictSchema,
  SearchSchema,
  CommentSchema,
  RankSchema,
  ClassifySchema,
  LanguageSchema,
  VideoSchema,
  ImageSchema
}