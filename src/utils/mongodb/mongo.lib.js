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

const isZero = fields => {
  const { _id, ...nextFields } = fields
  return Object.values(nextFields).some(field => field == 0)
}
const isOne = fields => {
  const { _id, ...nextFields } = fields
  return Object.values(nextFields).some(field => field == 1)
}

function prePopulate(populate) {
  return function() {
    let activePopulate = []
    const { _fields: fields } = this
    const zero = isZero(fields)
    let fieldArr = []
    //筛选同字段不同层
    Object.keys(fields).forEach(field => {
      const index = fieldArr.findIndex(f => {
        field.includes(f)
      })
      if(!!~index) {
        fieldArr.splice(index, 1, field)
      }else {
        fieldArr.push(field)
      }
    })

    activePopulate = populate.filter(pop => {
      const { path } = pop
      const pathArr = path.split('.')
      return zero ? ( 
        !fieldArr.some(field => {
          let fArr = field.split('.')
          let clipArr
          if(fArr.length > pathArr.length) {
            clipArr = fArr.slice(0, pathArr.length)
            return pathArr.every((p, i) => p === clipArr[i])
          }else {
            clipArr = pathArr.slice(0, fArr.length)
            return fArr.every((f, i) => f === clipArr[i])
          }
        })
      )
        : 
        fieldArr.some(field => {
          let fArr = field.split('.')
          let clipArr
          if(fArr.length <= pathArr.length){
            clipArr = pathArr.slice(0, fArr.length)
            return fArr.every((f, i) => f === clipArr[i])
          }
          return false
        })
    })


    activePopulate.forEach(active => {
      this.populate(active)
    })
  }
}

//预设
const PRE_USER_FIND = [
 {
   path: 'avatar',
   select: {
    src: 1,
    _id: 0
   }
 }, 
]
const PRE_GLOBAL_FIND = []
const PRE_ROOM_FIND = [
  {
    path: 'info.avatar',
    select: {
      src: 1,
      _id: 0
    }
  }
]
const PRE_MESSAGE_FIND = [
  {
    path: 'content.image',
    select: {
      _id: 0,
      src: 1
    }
  },
  {
    path: 'content.video',
    select: {
      _id: 0,
      src: 1
    }
  }
]
const PRE_MOVIE_FIND = [
  {
    path: 'video',
    select: {
      _id: 0,
      src: 1,
      poster: 1
    }
  },
  {
    path: 'images',
    select: {
      _id: 0,
      src: 1
    }
  },
  {
    path: 'poster',
    select: {
      _id: 0,
      src: 1
    }
  },
  {
    path: 'tag',
    select: {
      text: 1,
      _id: 0
    }
  }
]
const PRE_TAG_FIND = []
const PRE_SPECIAL_FIND = [
  {
    path: 'poster',
    select: {
      _id: 0,
      src: 1
    }
  }
]
const PRE_ACTOR_FIND = [
  {
    path: 'other.avatar',
    select: {
      _id: 0,
      src: 1
    }
  }
]
const PRE_DIRECTOR_FIND = [
  {
    path: 'other.avatar',
    select: {
      _id: 0,
      src: 1
    }
  }
]
const PRE_DISTRICT_FIND = []
const PRE_SEARCH_FIND = []
const PRE_COMMENT_FIND = [
  {
    path: 'content.image',
    select: {
      src: 1,
      _id: 0
    }
  }, 
  {
    path: 'content.video',
    select: {
      src: 1,
      _id: 0
    }
  },
  {
    path: 'user_info',
    select: {
      avatar: 1,
      username: 1
    }
  },
  {
    path: 'comment_users',
    select: {
      avatar: 1,
      username: 1
    }
  }
]
const PRE_RANK_FIND = [
  {
    path: 'icon',
    select: {
      _id: 0,
      src: 1
    }
  }
]
const PRE_CLASSIFY_FIND = [
  {
    path: 'icon',
    select: {
      _id: 0,
      src: 1
    }
  }
]
const PRE_LANGUAGE_FIND = []
const PRE_VIDEO_FIND = []
const PRE_IMAGE_FIND = []
const PRE_OTHER_FIND = []
const PRE_BARRAGE_FIND = [
  {
    path: 'user',
    select: {
      _id: 1
    }
  },
  {
    path: 'like_users',
    select: {
      _id: 1
    }
  }
]

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
  create_user: {
    type: ObjectId,
    ref: 'user'
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

const BarrageSchema = new Schema({
  origin: {
    type: ObjectId,
    ref: 'movie',
    required: true
  },
  user: {
    type: ObjectId,
    ref: 'user',
    required: true
  },
  like_users: [{
    type: ObjectId,
    ref: 'user'
  }],
  time_line: {
    type: Number,
    required: true
  }
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
  barrage: {
    type: ObjectId,
    ref: 'barrage'
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
  stauts: {
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
  // match: [{
  //   type: ObjectId,
  //   ref: 'movie'
  // }],
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
  name: {
    type: String,
    required: true
  },
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
    uppercase: true,
    enum: [ "USER", "SYSTEM" ]
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  },
  auth: {
    required: true,
    type: String,
    enum: [ 'PUBLIC', 'PRIVATE' ],
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  info: {
    complete: [{
      type: Number,
      required: true,
      min: 0
    }],
    chunk_size: {
      type: Number,
      min: 1
    },
    size: {
      type: Number,
      min: 1
    },
    mime: {
      type: String,
      enum: [],
      uppercase: true,
      required: true,
      get: function(v) { return v ? v.toLowerCase() : v }
    },
    status: {
      type: String,
      enum: ['ERROR', 'COMPLETE', 'UPLOADING'],
      uppercase: true,
      required: true
    }
  },
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
    uppercase: true,
    enum: [ "USER", "SYSTEM" ]
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  },
  auth: {
    required: true,
    type: String,
    enum: [ 'PUBLIC', 'PRIVATE' ],
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  info: {
    complete: [{
      type: Number,
      min: 0
    }],
    chunk_size: {
      type: Number,
      min: 1
    },
    size: {
      type: Number,
      min: 1
    },
    mime: {
      type: String,
      enum: [],
      uppercase: true,
      get: function(v) { return v ? v.toLowerCase() : v }
    },
    status: {
      type: String,
      enum: ['ERROR', 'COMPLETE', 'UPLOADING'],
      uppercase: true,
      required: true
    }
  },
}, {
  ...defaultConfig
})

const OtherMediaSchema = new Schema({
  name: String,
  src: {
    type: String,
    required: true
  },
  origin_type: {
    required: true,
    type: String,
    uppercase: true,
    enum: [ "USER", 'SYSTEM' ]
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  },
  auth: {
    required: true,
    type: String,
    enum: [ 'PUBLIC', 'PRIVATE' ],
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  info: {
    complete: [{
      type: Number,
      min: 0
    }],
    chunk_size: {
      type: Number,
      min: 1
    },
    size: {
      type: Number,
      min: 1
    },
    mime: {
      type: String,
      enum: [],
      uppercase: true,
      get: function(v) { return v ? v.toLowerCase() : v }
    },
    status: {
      type: String,
      enum: ['ERROR', 'COMPLETE', 'UPLOADING'],
      uppercase: true,
      required: true
    }
  },
})

const FeedbackSchema = new Schema({
  user_info: {
    type: ObjectId,
    ref: 'user'
  },
  content: {
    text: String,
    image: [{
      type: ObjectId,
      ref: 'image'
    }],
    video: [{
      type: ObjectId,
      ref: 'video'
    }]
  }
}, {
  ...defaultConfig
})

//预处理
UserSchema.pre('find', prePopulate(PRE_USER_FIND))
UserSchema.pre('findOne', prePopulate(PRE_USER_FIND))
UserSchema.pre('findOneAndUpdate', prePopulate(PRE_USER_FIND))
GlobalSchema.pre('find', prePopulate(PRE_GLOBAL_FIND))
GlobalSchema.pre('findOne', prePopulate(PRE_GLOBAL_FIND))
GlobalSchema.pre('findOneAndUpdate', prePopulate(PRE_GLOBAL_FIND))
RoomSchema.pre('find', prePopulate(PRE_ROOM_FIND))
RoomSchema.pre('findOne', prePopulate(PRE_ROOM_FIND))
RoomSchema.pre('findOneAndUpdate', prePopulate(PRE_ROOM_FIND))
MessageSchema.pre('find', prePopulate(PRE_MESSAGE_FIND))
MessageSchema.pre('findOne', prePopulate(PRE_MESSAGE_FIND))
MessageSchema.pre('findOneAndUpdate', prePopulate(PRE_MESSAGE_FIND))
MovieSchema.pre('find', prePopulate(PRE_MOVIE_FIND))
MovieSchema.pre('findOne', prePopulate(PRE_MOVIE_FIND))
MovieSchema.pre('findOneAndUpdate', prePopulate(PRE_MOVIE_FIND))
TagSchema.pre('find', prePopulate(PRE_TAG_FIND))
TagSchema.pre('findOne', prePopulate(PRE_TAG_FIND))
TagSchema.pre('findOneAndUpdate', prePopulate(PRE_TAG_FIND))
SpecialSchema.pre('find', prePopulate(PRE_SPECIAL_FIND))
SpecialSchema.pre('findOne', prePopulate(PRE_SPECIAL_FIND))
SpecialSchema.pre('findOneAndUpdate', prePopulate(PRE_SPECIAL_FIND))
ActorSchema.pre('find', prePopulate(PRE_ACTOR_FIND))
ActorSchema.pre('findOne', prePopulate(PRE_ACTOR_FIND))
ActorSchema.pre('findOneAndUpdate', prePopulate(PRE_ACTOR_FIND))
DirectorSchema.pre('find', prePopulate(PRE_DIRECTOR_FIND))
DirectorSchema.pre('findOne', prePopulate(PRE_DIRECTOR_FIND))
DirectorSchema.pre('findOneAndUpdate', prePopulate(PRE_DIRECTOR_FIND))
DistrictSchema.pre('find', prePopulate(PRE_DISTRICT_FIND))
DistrictSchema.pre('findOne', prePopulate(PRE_DISTRICT_FIND))
DistrictSchema.pre('findOneAndUpdate', prePopulate(PRE_DISTRICT_FIND))
SearchSchema.pre('find', prePopulate(PRE_SEARCH_FIND))
SearchSchema.pre('findOne', prePopulate(PRE_SEARCH_FIND))
SearchSchema.pre('findOneAndUpdate', prePopulate(PRE_SEARCH_FIND))
CommentSchema.pre('find', prePopulate(PRE_COMMENT_FIND))
CommentSchema.pre('findOne', prePopulate(PRE_COMMENT_FIND))
CommentSchema.pre('findOneAndUpdate', prePopulate(PRE_COMMENT_FIND))
RankSchema.pre('find', prePopulate(PRE_RANK_FIND))
RankSchema.pre('findOne', prePopulate(PRE_RANK_FIND))
RankSchema.pre('findOneAndUpdate', prePopulate(PRE_RANK_FIND))
ClassifySchema.pre('find', prePopulate(PRE_CLASSIFY_FIND))
ClassifySchema.pre('findOne', prePopulate(PRE_CLASSIFY_FIND))
ClassifySchema.pre('findOneAndUpdate', prePopulate(PRE_CLASSIFY_FIND))
LanguageSchema.pre('find', prePopulate(PRE_LANGUAGE_FIND))
LanguageSchema.pre('findOne', prePopulate(PRE_LANGUAGE_FIND))
LanguageSchema.pre('findOneAndUpdate', prePopulate(PRE_LANGUAGE_FIND))
VideoSchema.pre('find', prePopulate(PRE_VIDEO_FIND))
VideoSchema.pre('findOne', prePopulate(PRE_VIDEO_FIND))
VideoSchema.pre('findOneAndUpdate', prePopulate(PRE_VIDEO_FIND))
ImageSchema.pre('find', prePopulate(PRE_IMAGE_FIND))
ImageSchema.pre('findOne', prePopulate(PRE_IMAGE_FIND))
ImageSchema.pre('findOneAndUpdate', prePopulate(PRE_IMAGE_FIND))
OtherMediaSchema.pre('find', prePopulate(PRE_OTHER_FIND))
OtherMediaSchema.pre('findOne', prePopulate(PRE_OTHER_FIND))
OtherMediaSchema.pre('findOneAndUpdate', prePopulate(PRE_OTHER_FIND))
BarrageSchema.pre('find', prePopulate(PRE_BARRAGE_FIND))
BarrageSchema.pre('findOne', prePopulate(PRE_BARRAGE_FIND))
BarrageSchema.pre('findOneAndUpdate', prePopulate(PRE_BARRAGE_FIND))

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
const OtherMediaModel = model('other_media', OtherMediaSchema)
const FeedbackModel = model('feedback', FeedbackSchema)
const BarrageModel = model('barrage', BarrageSchema)

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
  OtherMediaModel,
  FeedbackModel,
  BarrageModel,
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
  ImageSchema,
  OtherMediaSchema,
  FeedbackSchema,
  BarrageSchema
}