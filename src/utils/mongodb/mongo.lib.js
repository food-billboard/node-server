const Day = require('dayjs')
const mongoose = require("mongoose")
const { Schema, model } = mongoose
const { Types: { ObjectId } } = mongoose
const { log4Database } = require('@src/config/winston')
const { 
  SCORE_EXCHANGE_CYCLE_TYPE,
  BEHAVIOUR_URL_TYPE_MAP, 
  EMAIL_REGEXP, 
  MEDIA_ORIGIN_TYPE, 
  METHOD_MAP, 
  USER_STATUS, 
  MOVIE_STATUS, 
  MOVIE_SOURCE_TYPE, 
  ROLES_MAP, 
  FEEDBACK_STATUS, 
  EAT_WHAT_MENU_TYPE,
  COMMENT_SOURCE_TYPE, 
  MEDIA_STATUS, 
  MEDIA_AUTH,  
  FRIEND_STATUS,
  ROOM_TYPE,
  MESSAGE_TYPE,
  MESSAGE_MEDIA_TYPE,
  ERROR_ORIGIN_TYPE,
  ERROR_TYPE,
  USER_HOT_HISTORY_TYPE,
  MESSAGE_POST_STATUS,
  SCREEN_TYPE,
  SCHEDULE_STATUS,
  SCREEN_MOCK_CONFIG_DATA_TYPE,
  SCREEN_MOCK_CONFIG_DATE_TYPE,
  SCREEN_MOCK_CONFIG_ADDRESS_TYPE,
  SCREEN_MOCK_CONFIG_LANGUAGE_TYPE,
  SCREEN_MOCK_CONFIG_TEXT_TYPE,
  SCREEN_MOCK_CONFIG_NAME_TYPE,
  THIRD_PARTY_REQUEST_METHOD,
  THIRD_PARTY_REQUEST_PARAMS_TYPE,
  EAT_WHAT_FOOD_TYPE,
  SCORE_TYPE,
  SCORE_TASK_REPEAT_TYPE
} = require('../constant')
const { formatMediaUrl } = require('../tool')

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
  usePushEach: true
}

const isZero = fields => {
  const { _id, ...nextFields } = fields
  return Object.values(nextFields).some(field => field == 0)
}
const isOne = fields => {
  const { _id, ...nextFields } = fields
  return Object.values(nextFields).some(field => field == 1)
}

//预处理
function prePopulate(populate) {
  return function(next) {
    let activePopulate = []
    const { _fields: fields={} } = this
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

    //!! need to test
    if(!zero) this.select({
      updatedAt: 1
    })

    activePopulate.forEach(active => {
      this.populate(active)
    })

    next()
  }
}

//完成处理
function postMiddleware(...params) {
  return log4Database(...params)
}

//预设
const PRE_USER_FIND = [
 {
   path: 'avatar',
   select: {
    src: 1,
    _id: 1
   }
 }, 
]
const PRE_EAT_WHAT_FIND = [
  {
    path: 'classify',
    select: {
     title: 1,
     description: 1,
     content: 1,
     _id: 1
    }
  }, 
 ]
const PRE_GLOBAL_FIND = []
const PRE_ROOM_FIND = [
  {
    path: 'info.avatar',
    select: {
      src: 1,
      _id: 1
    }
  }
]
const PRE_MESSAGE_FIND = [
  {
    path: 'content.image',
    select: {
      _id: 1,
      src: 1
    }
  },
  {
    path: 'content.video',
    select: {
      _id: 1,
      src: 1
    }
  }
]
const PRE_MOVIE_FIND = [
  {
    path: 'video',
    select: {
      _id: 1,
      src: 1,
      poster: 1
    }
  },
  {
    path: 'images',
    select: {
      _id: 1,
      src: 1
    }
  },
  {
    path: 'poster',
    select: {
      _id: 1,
      src: 1
    }
  },
  {
    path: 'tag',
    select: {
      text: 1,
      _id: 1
    }
  }
]
const PRE_TAG_FIND = []
const PRE_SPECIAL_FIND = [
  {
    path: 'poster',
    select: {
      _id: 1,
      src: 1
    }
  }
]
const PRE_ACTOR_FIND = [
  {
    path: 'other.avatar',
    select: {
      _id: 1,
      src: 1
    }
  }
]
const PRE_DIRECTOR_FIND = [
  {
    path: 'other.avatar',
    select: {
      _id: 1,
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
      _id: 1
    }
  }, 
  {
    path: 'content.video',
    select: {
      src: 1,
      poster: 1,
      _id: 1
    }
  },
  {
    path: 'user_info',
    select: {
      avatar: 1,
      username: 1,
      roles: 1
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
      _id: 1,
      src: 1
    }
  }
]
const PRE_CLASSIFY_FIND = [
  {
    path: 'icon',
    select: {
      _id: 1,
      src: 1
    }
  }
]
const PRE_LANGUAGE_FIND = []
const PRE_VIDEO_FIND = [
  {
    path: 'poster',
    select: {
      _id: 1,
      src: 1
    }
  }
]
const PRE_IMAGE_FIND = [

]
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
const PRE_BEHAVIOUR_FIND = []

const PRE_SCORE_AWARD_FIND = [
  {
    path: 'award_image_list',
    select: {
      _id: 1,
      src: 1
    }
  },
]

//user
const UserSchema = new Schema({
  score: {
    type: Number 
  },
  birthday: {
    type: Date
  },
	mobile: {
    type: Number,
    unique: true,
    set: (v) => Number(v),
    required: true,
    validate: {
      validator: function(v) {
        return /^1[3456789]\d{9}$/.test(v);
      },
    },
  },
	password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    validate: {
      validator: function(v) {
        return EMAIL_REGEXP.test(v);
      },
    },
    required: true
  },
	username: {
    type: String,
    default: '默认名称'
  },
  description: {
    type: String,
    default: "描述一下你自己吧",
    min: 0,
    max: 50
  },
	avatar: {
    // default: ObjectId('5edb3c7b4f88da14ca419e61'),
    type: ObjectId,
    ref: 'image'
  },
  hot_history: [{
    _id: {
      type: ObjectId,
      ref: 'user'
    },
    origin_id: {
      type: ObjectId,
      refPath: 'origin_type'
    },
    timestamps: {
      type: Number,
      min: 0
    },
    origin_type: {
      type: String,
      enum: Object.keys(USER_HOT_HISTORY_TYPE),
      default: USER_HOT_HISTORY_TYPE['comment']
    }
  }],
	hot: {
    type: Number,
    default: 0,
    min: 0,
  },
  fans: [{
    _id: {
      type: ObjectId,
      ref: 'user',
    },
    timestamps: {
      type: Number,
      min: 0
    }
  }],
  attentions: [{
    _id: {
      type: ObjectId,
      ref: 'user',
    },
    timestamps: {
      type: Number,
      min: 0
    }
  }],
  friends: {
    type: Number,
    default: 0
  },
  friend_id: {
    type: ObjectId,
    ref: 'friend'
  },
  issue: [{
    _id: {
      type: ObjectId,
      ref: 'movie'
    },
    timestamps: {
      type: Number,
      min: 0
    }
  }],
  glance: [{
    _id: {
      type: ObjectId,
      ref: 'movie'
    },
    timestamps: {
      type: Number,
      min: 0
    },
  }],
  glance_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  comment: [{
    type: ObjectId,
    ref: 'comment',
  }],
  store: [{
    _id: {
      type: ObjectId,
      ref: 'movie'
    },
    timestamps: {
      min: 0,
      type: Number
    }
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
    },
    timestamps: {
      type: Number,
      min: 0
    }
  }],
  allow_many: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: USER_STATUS,
    trim: true,
    uppercase: true,
    default: "SIGNOUT"
  },
  roles: [{
    type: String,
    enum: Object.keys(ROLES_MAP),
    set: (v) => {
      return v.toUpperCase()
    }
  }]
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
  visit_count: {
    type: Number,
    min: 0
  },
  valid: {
    type: Boolean,
    default: false 
  },
  origin: {
    type: ObjectId,
    ref: 'user',
    required: true
  },
}, {
  ...defaultConfig
})

const MemberSchema = new Schema({ 
  user: {
    type: ObjectId,
    // required: true,
    ref: 'user'
  },
  sid: {
    type: String,
  },
  temp_user_id: {
    type: String 
  },
  // status: {
  //   enum: Object.keys(ROOM_USER_NET_STATUS),
  //   uppercase: true,
  //   type: String,
  //   trim: true,
  //   required: true
  // },
  room: [{
    type: ObjectId,
    ref: 'room'
  }]
}, {
  ...defaultConfig
})

//room
const RoomSchema = new Schema({
  type:  {
    type: String,
    required: true,
    enum: Object.keys(ROOM_TYPE),
    uppercase: true,
    trim: true,
    default: ROOM_TYPE.CHAT
  },
  origin: {
    type: Boolean,
    default: false,
    required: true,
  },
  create_user: {
    type: ObjectId,
    ref: 'member'
  },
  deleted: {
    type: Boolean,
    default: false 
  },
  delete_users: [{
    type: ObjectId,
    ref: 'member'
  }],
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
      type: ObjectId,
      ref: 'member'
    }
  ],
  online_members: [
    {
      type: ObjectId,
      ref: 'member'
    }
  ],
  message: [{
    type: ObjectId,
    ref: 'message',
    // get: function(v) {
    //   if(this.origin === true && this.type === 'SYSTEM') return v
    //   return null
    // },
    // set: function(v) {
    //   if(this.origin === true && this.type === 'SYSTEM') return v
    //   return null
    // }
  }]
}, {
  ...defaultConfig
})

const MessageSchema = new Schema({
  message_type: {
    required: true,
    enum: Object.keys(MESSAGE_TYPE),
    type: String,
    default: MESSAGE_TYPE.USER,
    trim: true,
    uppercase: true,
  },
  user_info: {
    type: ObjectId,
    ref: 'member',
    required: true,
  },
  point_to: {
    type: ObjectId,
    ref: 'member',
  },
  readed: [
    {
      type: ObjectId,
      ref: 'member'
    }
  ],
  deleted: [
    {
      type: ObjectId,
      ref: 'member'
    }
  ],
  media_type: {
    type: String,
    uppercase: true,
    trim: true,
    enum: Object.keys(MESSAGE_MEDIA_TYPE),
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
    },
    audio: {
      type: ObjectId
    }
  },
  status: {
    type: String,
    uppercase: true,
    trim: true,
    enum: Object.keys(MESSAGE_POST_STATUS),
    required: true,
    default: MESSAGE_POST_STATUS.DONE
  }
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
  content: {
    type: String,
    minlength: 1,
    required: true
  },
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
    index: true
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
      default: new Date(),
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
    ref: 'video',
  },
  images: [{
    type: ObjectId,
    ref: 'image'
  }],
  poster: {
    type: ObjectId,
    ref: 'image',
  },
  barrage: [{
    type: ObjectId,
    ref: 'barrage'
  }],
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
    default: 1,
    min: 1
  },
	total_rate: {
    type: Number,
    default: 0,
  },
  source_type: {
    type: String,
    required: true,
    enum: Object.keys(MOVIE_SOURCE_TYPE),
    trim: true,
    uppercase: true,
  },
  status: {
    type: String,
    required: true,
    enum: Object.keys(MOVIE_STATUS),
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
  weight: {
    type: Number
  },
  source: {
    type: ObjectId,
    ref: 'movie'
  },
  valid: {
    type: Boolean,
    default: true,
    required: true
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
  glance: [{
    _id: {
      type: ObjectId,
      ref: 'user'
    },
    timestamps: {
      type: Number
    }
  }],
  glance_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  valid: {
    type: Boolean,
    default: false,
    required: true
  },
  origin: {
    type: ObjectId,
    ref: 'user',
    require: true
  }
}, {
  ...defaultConfig
})

const ActorSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
    validator: {
      validate: (v) => {
        return v.length < 100
      }
    }
  },
  key: {
    type: String,
    required: true,
    default: 'A',
    uppercase: true
  },
  // works: [{
  //   type: ObjectId,
  //   ref: 'movie'
  // }],
  country: {
    type: ObjectId,
    ref: 'district',
    required: true
  },
  other: {
    another_name: {
      type: String,
    },
    avatar: {
      type: ObjectId,
      ref: 'image'
    }
  },
  source_type: {
    type: String,
    enum: Object.keys(MOVIE_SOURCE_TYPE),
    default: MOVIE_SOURCE_TYPE.USER
  },
  source: {
    type: ObjectId,
    ref: 'user'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const DirectorSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
    validator: {
      validate: (v) => {
        return v.length < 100
      }
    }
  },
  key: {
    type: String,
    required: true,
    default: 'A',
    uppercase: true
  },
  country: {
    type: ObjectId,
    ref: 'district',
    required: true
  },
  // works: [{
  //   type: ObjectId,
  //   ref: 'movie'
  // }],
  other: {
    another_name: {
      type: String,
    },
    avatar: {
      type: ObjectId,
      ref: 'image'
    }
  },
  source_type: {
    type: String,
    enum: Object.keys(MOVIE_SOURCE_TYPE),
    default: MOVIE_SOURCE_TYPE.USER
  },
  source: {
    type: ObjectId,
    ref: 'user'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const DistrictSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    validator: {
      validate: (v) => {
        return v.length < 100
      }
    }
  },
  key: {
    type: String,
    required: true,
    default: 'A',
    uppercase: true
  },
  other: {},
  source_type: {
    type: String,
    enum: Object.keys(MOVIE_SOURCE_TYPE),
    default: MOVIE_SOURCE_TYPE.USER
  },
  source: {
    type: ObjectId,
    ref: 'user'
  }
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
	match_texts: [{
    type: String,
    min: 1
  }],
  hot: [{
    type: Date,
  }],
  other: {},
}, {
  ...defaultConfig,
  minimize: false
})

const CommentSchema = new Schema({
  source_type: {
    type: String,
    enum: Object.keys(COMMENT_SOURCE_TYPE),
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
  match: [
    {
      type: ObjectId,
      ref: 'movie'
    }
  ],
  icon: {
    type: ObjectId,
    ref: 'image'
  },
  match_pattern: [{
    origin_id: {
      type: ObjectId
    },
    origin: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    op: {
      type: Number,
      default: 1
    }
  }],
  match_field: {
    _id: {
      type: ObjectId,
      refPath: 'field'
    },
    field: {
      type: String,
      // enum: [ "GLANCE", 'AUTHOR_RATE', 'HOT', 'TOTAL_RATE', 'CLASSIFY' ],
      enum: [ 'classify', 'district' ],
      lowercase: true,
      get: function(v) {
        return v
      }
    }
  },
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
    validator: {
      validate: (v) => {
        return v.length < 100
      }
    }
  },
  key: {
    type: String,
    required: true,
    default: 'A',
    uppercase: true
  },
  other: {},
  icon: {
    type: ObjectId,
    ref: 'image'
  },
  glance: {
    type: Number,
    default: 0
  },
  source_type: {
    type: String,
    enum: Object.keys(MOVIE_SOURCE_TYPE),
    default: MOVIE_SOURCE_TYPE.USER
  },
  source: {
    type: ObjectId,
    ref: 'user'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const ScreenMediaClassifySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    validator: {
      validate: (v) => {
        return v.length < 100
      }
    }
  },
  user: {
    type: ObjectId,
    ref: 'user'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const ScreenMediaSchema = new Schema({
  image: {
    type: ObjectId,
    ref: 'image'
  },
  classify: {
    type: ObjectId,
    ref: 'screen_media'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const ScreenShotSchema = new Schema({
  screen: {
    type: ObjectId,
    ref: 'screen'
  },
  user: {
    type: ObjectId,
    ref: 'user'
  },
  description: {
    type: String
  },
  data: {
    type: String,
    required: true 
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
    validator: {
      validate: (v) => {
        return v.length < 100
      }
    }
  },
  key: {
    type: String,
    required: true,
    default: 'A',
    uppercase: true
  },
  other: {},
  source_type: {
    type: String,
    enum: Object.keys(MOVIE_SOURCE_TYPE),
    default: MOVIE_SOURCE_TYPE.USER
  },
  source: {
    type: ObjectId,
    ref: 'user'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const VideoSchema = new Schema({
  expire: Date,
  name: {
    type: String,
    required: true,
  },
  src: {
    type: String,
    required: true,
    unique: true,
    get: formatMediaUrl
  },
  poster: {
    type: ObjectId,
    ref: 'image'
  },
  origin_type: {
    required: true,
    type: String,
    enum: Object.keys(MEDIA_ORIGIN_TYPE),
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  description: {
    type: String 
  },
  file_name: {
    type: String
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  },
  white_list: [
    {
      type: ObjectId,
      ref: 'user'
    }
  ],
  auth: {
    required: true,
    type: String,
    enum: Object.keys(MEDIA_AUTH),
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  info: {
    md5: {
      type: String,
      required: true,
      // unique: true
    },
    // 完成情况
    complete: [{
      type: Number,
      // required: true,
      min: 0
    }],
    // 分片大小
    chunk_size: {
      type: Number,
      min: 1
    },
    // 文件大小
    size: {
      type: Number,
      min: 1
    },
    // 文件mime
    mime: {
      type: String,
      enum: [],
      uppercase: true,
      required: true,
      get: function(v) { return v ? v.toLowerCase() : v }
    },
    // 上传状态
    status: {
      type: String,
      enum: Object.keys(MEDIA_STATUS),
      uppercase: true,
      required: true,
      default: 'COMPLETE'
    }
  },
}, {
  ...defaultConfig,
})

const ImageSchema = new Schema({
  expire: Date,
  name: String,
  src: {
    type: String,
    required: true,
    unique: true,
    get: formatMediaUrl
  },
  origin_type: {
    required: true,
    type: String,
    enum: Object.keys(MEDIA_ORIGIN_TYPE),
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  },
  white_list: [
    {
      type: ObjectId,
      ref: 'user'
    }
  ],
  auth: {
    required: true,
    type: String,
    enum: Object.keys(MEDIA_AUTH),
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  description: {
    type: String 
  },
  file_name: {
    type: String
  },
  info: {
    md5: {
      type: String,
      required: true
    },
    complete: [{
      type: Number,
      min: 0
    }],
    chunk_size: {
      type: Number,
      min: 1,
      default: 1
    },
    size: {
      type: Number,
      min: 1,
      default: 1
    },
    mime: {
      type: String,
      enum: [],
      required: true,
      uppercase: true,
      get: function(v) { return v ? v.toLowerCase() : v }
    },
    status: {
      type: String,
      enum: Object.keys(MEDIA_STATUS),
      uppercase: true,
      required: true
    }
  },
}, {
  ...defaultConfig,
})

const OtherMediaSchema = new Schema({
  expire: Date,
  name: String,
  src: {
    type: String,
    required: true,
    unique: true,
    get: formatMediaUrl
  },
  description: {
    type: String 
  },
  file_name: {
    type: String
  },
  origin_type: {
    required: true,
    type: String,
    enum: Object.keys(MEDIA_ORIGIN_TYPE),
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  origin: {
    type: ObjectId,
    ref: 'user'
  },
  white_list: [
    {
      type: ObjectId,
      ref: 'user'
    }
  ],
  auth: {
    required: true,
    type: String,
    enum: Object.keys(MEDIA_AUTH),
    uppercase: true,
    get: function(v) { return v ? v.toLowerCase() : v }
  },
  info: {
    md5: {
      type: String,
      required: true
    },
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
      required: true,
      get: function(v) { return v ? v.toLowerCase() : v }
    },
    status: {
      type: String,
      enum: Object.keys(MEDIA_STATUS),
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
  },
  status: {
    type: String,
    enum: Object.keys(FEEDBACK_STATUS),
    default: 'DEALING'
  },
  history: [
    {
      user: {
        type: ObjectId,
        ref: 'user',
        required: true
      },
      timestamps: {
        type: Date
      },
      description: {
        type: String,
        required: true
      }
    }
  ]
}, {
  ...defaultConfig
})

const EatWhatSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'user'
  },
  description: {
    type: String,
  },
  classify: {
    type: ObjectId,
    ref: 'eat_what_classify'
  },
  date: {
    type: Date 
  },
  menu_type: {
    type: String,
    enum: Object.keys(EAT_WHAT_MENU_TYPE),
    default: 'BREAKFAST'
  },
}, {
  ...defaultConfig
})

const EatWhatClassifySchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'user'
  },
  content: {
    type: String,
  },
  description: {
    type: String,
  },
  title: {
    type: String,
    unique: true,
    required: true
  },
  menu_type: [{
    type: String,
    enum: Object.keys(EAT_WHAT_MENU_TYPE),
    default: 'BREAKFAST'
  }],
  food_type: [{
    type: String,
    enum: Object.keys(EAT_WHAT_FOOD_TYPE),
    default: 'OTHER'
  }]
}, {
  ...defaultConfig
})

const AuthSchema = new Schema({
  roles: [{
    required: true,
    type: String,
    enum: Object.keys(ROLES_MAP), 
    set: (v) => {
      return v.toUpperCase()
    }
  }],
  allow: {
    resources: [{
      type: String,
    }],
    actions: [{
      url: {
        type: String,
        validator: {
          validate: (v) => {
            return typeof v === 'string' && /(\/.+)+(\?(.+=.+)+)?/.test(v)
          }
        }
      },
      method: {
        type: String,
        enum: METHOD_MAP,
        set: (v) => {
          return v.toUpperCase()
        } 
      }
    }],
    attributes: [{
      type: String
    }],
    where: [{
      platform: {
        type: String
      },
      app: {
        type: String
      }
    }],
  }
}, {
  ...defaultConfig
})

const BehaviourSchema = new Schema({
  timestamps: {
    type: Number,
    min: 0
  },
  url_type: {
    type: String,
    required: true,
    enum: Object.keys(BEHAVIOUR_URL_TYPE_MAP)
  },
  user: {
    type: ObjectId,
    ref: 'user'
  },
  target: {
    type: ObjectId,
  }
}, {
  ...defaultConfig
})

const FriendsSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'user',
    unique: true 
  },
  member: {
    type: ObjectId,
    ref: 'member',
    unique: true 
  },
  friends: [{
    _id: {
      type: ObjectId,
      ref: 'friend'
    },
    timestamps: {
      type: Number 
    },
    status: {
      type: String,
      enum: Object.keys(FRIEND_STATUS),
      default: FRIEND_STATUS.TO_AGREE,
      uppercase: true 
    }
  }]
}, {
  ...defaultConfig
})

const ErrorSchema = new Schema({
  origin_type: {
    type: String,
    enum: Object.keys(ERROR_ORIGIN_TYPE)
  },
  error_type: {
    type: String,
    enum: Object.keys(ERROR_TYPE)
  },
  error_message: {
    type: String 
  },
}, {
  ...defaultConfig
})

const ScheduleSchema = new Schema({
  name: {
    type: String,
    required: true 
  },
  description: {
    type: String 
  },
  time: {
    type: String,
    required: true 
  },
  status: {
    type: String,
    enum: Object.keys(SCHEDULE_STATUS)
  }
})

// ------------------------------------大屏 ------------------------------------

const ScreenSchema = new Schema({
  user: {
    type: ObjectId,
    required: true 
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  data: {
    type: String,
    required: true,
  },
  enable: {
    type: Boolean,
    default: false 
  },
  flag: {
    type: String,
    enum: Object.keys(SCREEN_TYPE),
    default: 'PC'
  },
  name: String,
  poster: String,
  description: String,
  screen_shot: {
    type: ObjectId,
    ref: 'screen_shot'
  }
}, {
  ...defaultConfig
})

const ScreenModelSchema = new Schema({
  user: {
    type: ObjectId,
    required: true 
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  data: {
    type: String,
    required: true,
  },
  enable: {
    type: Boolean,
    default: false 
  },
  flag: {
    type: String,
    enum: Object.keys(SCREEN_TYPE),
    default: 'PC'
  },
  name: String,
  poster: String,
  description: String 
}, {
  ...defaultConfig
})

const ScreenMockSchema = new Schema({
  // mock的数据类型
  data_kind: String,
  // mock的数据，在初始化或修改时生成
  mock_data: String,
  description: String, 
  // 配置
  config_type: {
    type: String, 
    enum: Object.keys(SCREEN_MOCK_CONFIG_DATA_TYPE)
  },
  user: {
    type: ObjectId,
    ref: 'user'
  },
  // color: {

  // },
  // web: {

  // },
  // boolean: {

  // },
  date: {
    date_type: {
      type: String, 
      enum: Object.keys(SCREEN_MOCK_CONFIG_DATE_TYPE)
    },
    format: String,
  },
  address: {
    address_type: {
      type: String, 
      enum: Object.keys(SCREEN_MOCK_CONFIG_ADDRESS_TYPE)
    },
    prefix: Boolean 
  },
  name: {
    language_type: {
      type: String, 
      enum: Object.keys(SCREEN_MOCK_CONFIG_LANGUAGE_TYPE)
    },
    name_type: {
      type: String, 
      enum: Object.keys(SCREEN_MOCK_CONFIG_NAME_TYPE)
    }
  },
  text: {
    min: Number,
    max: Number,
    language_type: {
      type: String, 
      enum: Object.keys(SCREEN_MOCK_CONFIG_LANGUAGE_TYPE)
    },
    text_type: {
      type: String, 
      enum: Object.keys(SCREEN_MOCK_CONFIG_TEXT_TYPE)
    }
  },
  image: {
    width: Number,
    height: Number,
    color: String,
    word: String,
    word_color: String 
  },
  number: {
    min: Number,
    max: Number,
    decimal: Boolean,
    dmin: Number,
    dmax: Number 
  },
  
}, {
  ...defaultConfig
})

const ThirdPartySchema = new Schema({
  name: String,
  description: String, 
  url: String,
  method: {
    type: String, 
    enum: Object.keys(THIRD_PARTY_REQUEST_METHOD)
  },
  headers: String,
  getter: String,
  user: ObjectId,
  example: String,
  params: [{
    name: String,
    description: String,
    data_type: {
      type: String,
      enum: Object.keys(THIRD_PARTY_REQUEST_PARAMS_TYPE)
    },
    children: [Object],
    default_value: Schema.Types.Mixed,
    validate_data: {
      type: String,
      required: false 
    },
  }],
}, {
  ...defaultConfig
})

// ------------------------------------大屏 ------------------------------------

const RaspberrySchema = new Schema({
  name: String,
  description: String, 
  url: String,
  folder: String,
  user: ObjectId,
}, {
  ...defaultConfig
})

const ScorePrimaryClassifySchema = new Schema({
  create_user: {
    type: ObjectId,
    ref: 'user'
  },
  content: {
    type: String,
    required: true,
  }
}, {
  ...defaultConfig,
})

const ScoreClassifyDesignSchema = new Schema({
  create_user: {
    type: ObjectId,
    ref: 'user'
  },
  holiday: Boolean,
  target_user: {
     type: ObjectId,
    ref: 'user'
  },
  classify: {
    type: ObjectId,
    ref: 'score_classify'
  },
  repeat_type: {
    type: String,
    enum: Object.keys(SCORE_TASK_REPEAT_TYPE),
  },
  repeat: [{
    type: Number
  }],
  max_age: Number,
  min_age: Number
}, {
  ...defaultConfig,
})

const ScoreClassifySchema = new Schema({
  create_user: {
    type: ObjectId,
    ref: 'user'
  },
  content: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: ObjectId,
    ref: 'image'
  },
  classify: {
    type: ObjectId,
    ref: 'score_primary_classify'
  },
  max_age: Number,
  min_age: Number
}, {
  ...defaultConfig,
})

// 积分奖品
const ScoreAwardSchema = new Schema({
  // 库存
  inventory: {
    type: Number
  },
  // 所需积分
  exchange_score: {
    type: Number
  },
  // 奖品图片
  award_image_list: [{
    type: ObjectId,
    ref: 'image'
  }],
  // 兑换周期
  award_cycle: {
    type: String,
    required: true,
    type: String,
    enum: Object.keys(SCORE_EXCHANGE_CYCLE_TYPE),
    uppercase: true,
  },
  // 兑换周期次数
  award_cycle_count: {
    type: Number
  },
  award_name: {
    type: String,
    required: true,
  },
  award_description: String,
  create_user: {
    type: ObjectId,
    ref: 'user'
  }
}, {
  ...defaultConfig,
})

// 积分兑换记录
const ExchangeMemorySchema = new Schema({
  // 兑换人
  exchange_user: {
    type: ObjectId,
    ref: 'user'
  },
  // 兑换目标 拿到东西的人
  exchange_target: {
    type: ObjectId,
    ref: 'user'
  },
  // 奖品id
  award: {
    type: ObjectId,
    required: true,
    ref: 'score_award'
  },
  // 核销时间
  check_date: {
    type: Date 
  }
}, {
  ...defaultConfig,
})

// 积分记录
const ScoreMemorySchema = new Schema({
  // 积分对象
  target_user: {
    type: ObjectId,
    ref: 'user'
  },
  // 积分分数
  target_score: {
    type: Number 
  },
  // 积分类型
  score_type: {
    type: String,
    // 完成 未完成 不评分 待定
    enum: Object.keys(SCORE_TYPE)
  },
  // 积分人
  create_user: {
    type: ObjectId,
    ref: 'user'
  },
  // 积分分类id
  target_classify: {
    type: ObjectId,
    ref: 'score_classify'
  },
  // 积分原因
  create_content: {
    type: String 
  },
  // 积分原因描述
  create_description: {
    type: String 
  }
}, {
  ...defaultConfig,
})

const FIND_OPERATION_LIB = [
  'find',
  'findOne',
  'findOneAndUpdate',
]

const SAVE_OPERATION_LIB = [
  'save'
]

//预处理
FIND_OPERATION_LIB.forEach(op => {
  UserSchema.pre(op, prePopulate(PRE_USER_FIND))
  GlobalSchema.pre(op, prePopulate(PRE_GLOBAL_FIND))
  RoomSchema.pre(op, prePopulate(PRE_ROOM_FIND))
  MessageSchema.pre(op, prePopulate(PRE_MESSAGE_FIND))
  MovieSchema.pre(op, prePopulate(PRE_MOVIE_FIND))
  TagSchema.pre(op, prePopulate(PRE_TAG_FIND))
  SpecialSchema.pre(op, prePopulate(PRE_SPECIAL_FIND))
  ActorSchema.pre(op, prePopulate(PRE_ACTOR_FIND))
  DirectorSchema.pre(op, prePopulate(PRE_DIRECTOR_FIND))
  DistrictSchema.pre(op, prePopulate(PRE_DISTRICT_FIND))
  SearchSchema.pre(op, prePopulate(PRE_SEARCH_FIND))
  CommentSchema.pre(op, prePopulate(PRE_COMMENT_FIND))
  RankSchema.pre(op, prePopulate(PRE_RANK_FIND))
  ClassifySchema.pre(op, prePopulate(PRE_CLASSIFY_FIND))
  LanguageSchema.pre(op, prePopulate(PRE_LANGUAGE_FIND))
  VideoSchema.pre(op, prePopulate(PRE_VIDEO_FIND))
  ImageSchema.pre(op, prePopulate(PRE_IMAGE_FIND))
  OtherMediaSchema.pre(op, prePopulate(PRE_OTHER_FIND))
  BarrageSchema.pre(op, prePopulate(PRE_BARRAGE_FIND))
  BehaviourSchema.pre(op, prePopulate(PRE_BEHAVIOUR_FIND))
  EatWhatSchema.pre(op, prePopulate(PRE_EAT_WHAT_FIND))
  // ScoreAwardSchema.post(op, prePopulate(PRE_SCORE_AWARD_FIND))
})

//完成处理
SAVE_OPERATION_LIB.forEach(op => {
  UserSchema.post(op, postMiddleware)
  GlobalSchema.post(op, postMiddleware)
  RoomSchema.post(op, postMiddleware)
  MessageSchema.post(op, postMiddleware)
  MovieSchema.post(op, postMiddleware)
  TagSchema.post(op, postMiddleware)
  SpecialSchema.post(op, postMiddleware)
  ActorSchema.post(op, postMiddleware)
  DirectorSchema.post(op, postMiddleware)
  DistrictSchema.post(op, postMiddleware)
  SearchSchema.post(op, postMiddleware)
  CommentSchema.post(op, postMiddleware)
  RankSchema.post(op, postMiddleware)
  ClassifySchema.post(op, postMiddleware)
  LanguageSchema.post(op, postMiddleware) 
  VideoSchema.post(op, postMiddleware)
  ImageSchema.post(op, postMiddleware)
  OtherMediaSchema.post(op, postMiddleware)
  BarrageSchema.post(op, postMiddleware)
  AuthSchema.post(op, postMiddleware)
  BehaviourSchema.post(op, postMiddleware)
  ScoreAwardSchema.post(op, postMiddleware)
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
const OtherMediaModel = model('other_media', OtherMediaSchema)
const FeedbackModel = model('feedback', FeedbackSchema)
const BarrageModel = model('barrage', BarrageSchema)
const AuthModel = model('auth', AuthSchema)
const EatWhatModel = model('eat_what', EatWhatSchema)
const EatWhatClassifyModel = model('eat_what_classify', EatWhatClassifySchema)
const BehaviourModel = model('behaviour', BehaviourSchema)
const FriendsModel = model('friend', FriendsSchema)
const MemberModel = model('member', MemberSchema)
const ErrorModel = model('error', ErrorSchema)
const ScheduleModel = model('schedule', ScheduleSchema)
const ScreenModal = model('screen', ScreenSchema)
const ScreenModelModal = model('screen_model', ScreenModelSchema)
const ScreenMockModel = model('screen_mock', ScreenMockSchema)
const ThirdPartyModel = model('third_party', ThirdPartySchema)
const RaspberryModel = model('raspberry', RaspberrySchema)
const ScreenMediaClassifyModel = model('screen_media_classify', ScreenMediaClassifySchema)
const ScreenMediaModel = model('screen_media', ScreenMediaSchema)
const ScreenShotModel = model('screen_shot', ScreenShotSchema)
const ScoreClassifyModel = model('score_classify', ScoreClassifySchema)
const ScoreAwardModel = model('score_award', ScoreAwardSchema)
const ExchangeMemoryModel = model('exchange_memory', ExchangeMemorySchema)
const ScoreMemoryModel = model('score_memory', ScoreMemorySchema)
const ScorePrimaryClassifyModel = model('score_primary_classify', ScorePrimaryClassifySchema)
const ScoreClassifyDesignModel = model('score_classify_design', ScoreClassifyDesignSchema)

module.exports = {
  ScorePrimaryClassifyModel,
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
  AuthModel,
  BehaviourModel,
  FriendsModel,
  MemberModel,
  ErrorModel,
  ScheduleModel,
  ScreenModal,
  ScreenModelModal,
  ScreenMockModel,
  ThirdPartyModel,
  RaspberryModel,
  ScreenMediaClassifyModel,
  ScreenMediaModel,
  ScreenShotModel,
  EatWhatModel,
  EatWhatClassifyModel,
  ScoreClassifyModel,
  ScoreAwardModel,
  ExchangeMemoryModel,
  ScoreMemoryModel,
  ScoreClassifyDesignModel,
  ScorePrimaryClassifySchema,
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
  BarrageSchema,
  AuthSchema,
  BehaviourSchema,
  FriendsSchema,
  MemberSchema,
  ErrorSchema,
  ScreenSchema,
  ScreenModelSchema,
  ScheduleSchema,
  ScreenMockSchema,
  ThirdPartySchema,
  RaspberrySchema,
  ScreenMediaClassifySchema,
  ScreenMediaSchema,
  ScreenShotSchema,
  EatWhatSchema,
  EatWhatClassifySchema,
  ScoreClassifySchema,
  ScoreAwardSchema,
  ExchangeMemorySchema,
  ScoreMemorySchema,
  ScoreClassifyDesignSchema
}