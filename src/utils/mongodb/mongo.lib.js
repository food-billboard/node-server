const Day = require('dayjs')
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId
const Mixed = mongoose.Types.Mixed

function getMill(time) {
  return Day(time).get('millisecond')
}

function setMill(time) {
  return Day(time).get('millisecond')
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
	mob: {
    type: Number,
    unique: true,
    set: (v) => Number(v),
    required: function() {
      return /^1[3456789]\d{9}$/g.test(this.mob)
    },
    alias: "mobile"
  },
	pwd: {
    type: String,
    alias: "password",
    required: true
  },
	uname: {
    type: String,
    alias: 'username',
    default: '默认名称'
  },
	avatar: {
    default: "默认图片id",
    type: ObjectId,
    ref: 'image'
  },
	hot: {
    type: Number,
    default: 0,
    min: 0,
    set: function(v) {
      if(v < 0) return 0
      return v
    }
  },
  fans: [{
    type: ObjectId,
    ref: 'user',
  }],
  ations: [{
    type: ObjectId,
    ref: 'user',
    alias: 'attentions'
  }],
  issue: [{
    type: ObjectId,
    ref: 'movie'
  }],
  glance: [{
    type: ObjectId,
    ref: 'movie'
  }],
  cmt: [{
    type: ObjectId,
    ref: 'comment',
    alias: 'comment'
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
      set: function() {
        if(this.rate < 0) return 0
        if(this.rate > 10) return 10
        return this.rate
      }
    }
  }],
  awmy: {
    type: Boolean,
    default: false,
    alias: 'allow_many' 
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
const globalSchema = new Schema({
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
const roomSchema = new Schema({
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
      default: '默认图片id'
    },
    name: {
      type: String,
      default: '默认名称'
    },
    desc: {
      type: String,
      alias: 'description',
      default: '默认介绍'
    }
  },
  mber: [
    {
      alias: 'member',
      user: {
        type: ObjectId,
        required: true,
        ref: 'user'
      },
      sid: {
        type: Mixed,
        default: null
      },
      status: {
        enum: [ "ONLINE", "OFFLINE" ],
        uppercase: true,
        type: String,
        trim: true,
        required: true
      },
      msg: [{
        alias: 'message',
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
  msg: [{
    alias: 'message',
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

const messageSchema = new Schema({
  uinfo: {
    required: true,
    type: {
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
    alias: 'user_info'
  },
  pto: {
    type: ObjectId,
    ref: 'user',
    alias: 'point_to'
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
  cont: {
    alias: 'content',
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

const movieSchema = new Schema({
  name: {
    type: String,
    required: true,
    set: function(v) {
      this.info.name = v
      return v
    }
  },
  info: {
    name: {
      type: String,
      required: true,
      set: function(v) {
        this.name = v
        return v
      }
    },
    othname: [{
      type: String,
      alias: 'another_name'
    }],
    desc: {
      type: String,
      alias: "description",
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
    scrtime: {
      type: Date,
      default: Date.now(),
      get: getMill,
      set: setMill,
      alias: 'screen_time'
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
  author_desc: {
    type: String,
    default: '默认描述',
    alias: 'author_description'
  },
  author_rate: {
    type: Number,
    default: 0,
  },
	hot: {
    type: Number,
    default: 0,
  },
  rates: {
    type: Number,
    default: 0,
    alias: 'rate_person'
  },
	sum_rate: {
    type: Number,
    default: 0,
    alias: 'total_rate'
  },
  sourcet: {
    type: String,
    required: true,
    enum: [ 'ORIGIN', 'USER' ],
    trim: true,
    uppercase: true,
    alias: 'source_type'
  },
  stauts: 
  {
    type: String,
    required: true,
    enum: [ 'VERIFY', 'COMPLETE' ],
    trim: true,
    uppercase: true,
  },
	relato: [{
    alias: 'related_to',
    film: {
      type: ObjectId,
      ref: 'movie',
      required: true
    },
    type: {
      type: String,
      enum: [ "DIRECTOR", "ACTOR", "AUTHOR", "CLASSIFY" ],
      trim: true,
      uppercase: true,
      required: true
    }
  }],
	samem: [{
    alias: 'same_film',
    film: {
      type: ObjectId,
      ref: 'movie',
      required: true
    },
    type: {
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

const tagSchema = new Schema({
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

const specialSchema = new Schema({
  movie: [{
    required: true,
    type: ObjectId,
    ref: 'movie'
  }],
  poster: {
    type: ObjectId,
    ref: 'image'
  },
  desc: {
    type: String,
    alias: 'description',
    default: '默认介绍'
  },
  name: {
    type: String,
    alias: 'description',
    required: true,
    unique: true,
  },
}, {
  ...defaultConfig
})

const actorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  works: [{
    type: ObjectId,
    ref: 'movie'
  }],
  other: {
    othname: {
      type: String,
      alias: 'another_name'
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

const directorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  works: [{
    type: ObjectId,
    ref: 'movie'
  }],
  other: {
    othname: {
      type: String,
      alias: 'another_name'
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

const districtSchema = new Schema({
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

const searchSchema = new Schema({
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

const commentSchema = new Schema({
  source: {
    type: {
      type: String,
      enum: ['MOVIE', 'USER'],
      required: true,
      trim: true,
      uppercase: true
    },
    comment: ObjectId
  },
  uinfo: {
    alias: 'user_info',
    type: ObjectId,
    ref: 'user'
  },
	subcoms: [{
    type: ObjectId,
    ref: 'comment',
    alias: 'sub_comments'
  }],
  sulike: {
    type: Number,
    alias: 'total_like',
    default: 0
  },
  likep: [{
    alias: 'like_person',
    type: ObjectId,
    ref: 'user'
  }],
  cont: {
    alias: 'content',
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
  com_users: [{
    type: ObjectId,
    ref: 'user',
    alias: 'comment_users'
  }]
}, {
  ...defaultConfig
})

const rankSchema = new Schema({
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
  match: [{
    type: String,
    enum: [ "GLANCE", 'AUTHOR_RATE', 'HOT', 'RATES', 'SUM_RATE' ],
    uppercase: true,
    get: function(v) {
      return v.toLowerCase()
    }
  }]
}, {
  ...defaultConfig,
  minimize: false
})

const classifySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  other: {},
  icon: {
    type: ObjectId,
    ref: 'image'
  }
}, {
  ...defaultConfig,
  minimize: false
})

const languageSchema = new Schema({
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

const videoSchema = new Schema({
  name: String,
  src: {
    type: String,
    required: true
  },
  poster: {
    type: ObjectId,
    ref: 'image'
  },
}, {
  ...defaultConfig
})

const imageSchema = new Schema({
  name: String,
  src: {
    type: String,
    required: true
  },
}, {
  ...defaultConfig
})

module.exports = {
  UserSchema,
  globalSchema,
  roomSchema,
  messageSchema,
  movieSchema,
  tagSchema,
  specialSchema,
  actorSchema,
  directorSchema,
  districtSchema,
  searchSchema,
  commentSchema,
  rankSchema,
  classifySchema,
  languageSchema,
  videoSchema,
  imageSchema
}