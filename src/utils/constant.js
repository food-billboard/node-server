const path = require('path')

const DEVELOPMENT_API_DOMAIN = 'http://localhost:4000'
const PRODUCTION_DOMAIN = "47.97.27.23"
// const PRODUCTION_DOMAIN = "www.glfswy.top"
const PRODUCTION_API_DOMAIN = `http://${PRODUCTION_DOMAIN}`

const FFMPEG_VERSION = "jrottenberg/ffmpeg:4.1-centos"

const EMAIL_AUTH = {
  pass: 'hgldcifqqwmlbajd',
  username: 'G',
  email: '944745590@qq.com'
}

//邮箱正则
const EMAIL_REGEXP = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/

//静态资源目录
const STATIC_FILE_PATH = path.resolve(__dirname, '../../static')
const STATIC_FILE_PATH_NO_WRAPPER = path.resolve(__dirname, '../../')

// 相关token的文件地址
const THIRD_PARTY_AUTH_TOKEN_CONFIG_PATH = path.join(__dirname, '../../', 'public/secrets/index.json')

//最大单次发送文件大小
const MAX_FILE_SINGLE_RESPONSE_SIZE = 1024 * 1024 * 5

const DIR_LIST = {
  dir: 'static',
  path: STATIC_FILE_PATH,
  children: [
    {
      dir: 'image',
      path: path.resolve(STATIC_FILE_PATH, 'image'),
    },
    {
      dir: 'video',
      path: path.resolve(STATIC_FILE_PATH, 'video'),
    },
    {
      dir: 'other',
      path: path.resolve(STATIC_FILE_PATH, 'other'),
    },
    {
      dir: 'template',
      path: path.resolve(STATIC_FILE_PATH, 'template'),
    }
  ]
}

const METHOD_MAP = [ 'GET', 'POST', 'DELETE', 'PUT', '*' ]

const USER_STATUS = [ 'SIGNIN', 'SIGNOUT', 'FREEZE' ]

const MOVIE_STATUS = {
  VERIFY: 'VERIFY', 
  COMPLETE: 'COMPLETE', 
  NOT_VERIFY: 'NOT_VERIFY',
  DRAFT: 'DRAFT'
}

const MOVIE_SOURCE_TYPE = {
  ORIGIN: 'ORIGIN', 
  USER: 'USER'
}

const ROLES_MAP = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  DEVELOPMENT: 2,
  SUB_DEVELOPMENT: 3,
  CUSTOMER: 4,
  USER: 5
}

const ROLES_NAME_MAP = Object.keys(ROLES_MAP).reduce((acc, cur) => {
  acc[cur] = cur 
  return acc 
}, {})

const FEEDBACK_STATUS = {
  DEALING: 'DEALING',
  DEAL: 'DEAL'
}

const COMMENT_SOURCE_TYPE = {
  movie: 'movie', 
  comment: 'comment'
}

const MEDIA_STATUS = {
  ERROR: 'ERROR', 
  COMPLETE: 'COMPLETE', 
  UPLOADING: 'UPLOADING'
}

const MEDIA_AUTH = {
  PUBLIC: 'PUBLIC', 
  PRIVATE: 'PRIVATE'
}

const MEDIA_ORIGIN_TYPE = MOVIE_SOURCE_TYPE

const NETWORK = process.env.NODE_ENV !== 'production' ? 'localhost' : PRODUCTION_DOMAIN

//关键词抽取个数
const EXTRACT_KEYWORD_TOP_N = 1

const BEHAVIOUR_URL_TYPE_MAP = {
  LOGIN_IN: 'LOGIN_IN', 
  LOGOUT: 'LOGOUT', 
  MOVIE_GET: 'MOVIE_GET', 
  MOVIE_POST: 'MOVIE_POST', 
  COMMENT: 'COMMENT', 
  SEARCH: 'SEARCH', 
  RANK_GET: 'RANK_GET', 
  CLASSIFY: 'CLASSIFY', 
  USER_GET: 'USER_GET',
  SPECIAL_GET: 'SPECIAL_GET'
}

const FRIEND_STATUS = {
  //正常
  NORMAL: 'NORMAL',
  //黑名单
  BLACK: 'BLACK',
  //等待同意
  TO_AGREE: 'TO_AGREE',
  //等待中(向他人发出申请时自己的状态)
  TO_AGREEING: "TO_AGREEING",
  //拒绝
  DIS_AGREE: "DIS_AGREE",
  //被拒绝
  DIS_AGREEED: "DIS_AGREEED",
  //同意(即将变成NORMAL)
  AGREE: "AGREE"
}

const ROOM_TYPE = {
  GROUP_CHAT: "GROUP_CHAT",
  CHAT: "CHAT",
  SYSTEM: "SYSTEM"
}

const ROOM_USER_NET_STATUS = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE"
}

const MESSAGE_TYPE = MOVIE_SOURCE_TYPE

const MESSAGE_MEDIA_TYPE = {
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  TEXT: "TEXT",
  VIDEO: "VIDEO",
  LINK: "LINK",
  FRIEND_INVITE: "FRIEND_INVITE",
}

const ERROR_ORIGIN_TYPE = {
  WEAPP: "WEAPP",
  MANAGEMENT: "ERROR_ORIGIN_TYPE",
  H5: "H5",
  WEB: "WEB",
  APP: "APP"
}

const ERROR_TYPE = {
  TYPE_ERROR: "TYPE_ERROR"
}

const USER_HOT_HISTORY_TYPE = {
  comment: "comment",
  barrage: "barrage"
}

const MESSAGE_POST_STATUS = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  DONE: "DONE"
}

const SCHEDULE_STATUS = {
  CANCEL: "CANCEL",
  SCHEDULING: "SCHEDULING"
}

const SCREEN_TYPE = {
  PC: 'PC',
  H5: 'H5'
}

const SCREEN_MOCK_CONFIG_DATA_TYPE = {
  color: 'color',
  date: 'date',
  address: 'address',
  web: 'web',
  text: 'text',
  image: 'image',
  number: 'number',
  boolean: 'boolean',
  name: 'name'
}

const SCREEN_MOCK_CONFIG_DATE_TYPE = {
  date: 'date',
  time: 'time',
  datetime: 'datetime'
}

const SCREEN_MOCK_CONFIG_ADDRESS_TYPE = {
  region: 'region',
  province: 'province',
  city: 'city',
  country: 'country'
}

const SCREEN_MOCK_CONFIG_LANGUAGE_TYPE = {
  chinese: 'chinese',
  english: 'english'
}

const SCREEN_MOCK_CONFIG_NAME_TYPE = {
  first: 'first',
  last: 'last',
  'first-last': 'first-last'
}

const SCREEN_MOCK_CONFIG_TEXT_TYPE = {
  paragraph: 'paragraph',
  sentence: 'sentence',
  word: 'word',
  title: 'title'
}

const THIRD_PARTY_REQUEST_METHOD = {
  POST: 'POST',
  GET: 'GET'
}

const THIRD_PARTY_REQUEST_PARAMS_TYPE = {
  number: 'number',
  string: 'string',
  object: 'object',
  'normal-array': 'normal-array',
  'object-array': 'object-array',
  boolean: 'boolean'
}

module.exports = {
  MESSAGE_MEDIA_TYPE,
  MESSAGE_TYPE,
  ROOM_USER_NET_STATUS,
  ROOM_TYPE,
  NETWORK,
  EMAIL_AUTH,
  EMAIL_REGEXP,
  STATIC_FILE_PATH,
  MAX_FILE_SINGLE_RESPONSE_SIZE,
  DIR_LIST,
  METHOD_MAP,
  USER_STATUS,
  MOVIE_STATUS,
  MOVIE_SOURCE_TYPE,
  ROLES_MAP,
  FEEDBACK_STATUS,
  COMMENT_SOURCE_TYPE,
  MEDIA_STATUS,
  MEDIA_AUTH,
  MEDIA_ORIGIN_TYPE,
  EXTRACT_KEYWORD_TOP_N,
  DEVELOPMENT_API_DOMAIN,
  PRODUCTION_API_DOMAIN,
  API_DOMAIN: process.env.NODE_ENV === 'production' ? PRODUCTION_API_DOMAIN : DEVELOPMENT_API_DOMAIN,
  BEHAVIOUR_URL_TYPE_MAP,
  FRIEND_STATUS,
  ERROR_ORIGIN_TYPE,
  ERROR_TYPE,
  USER_HOT_HISTORY_TYPE,
  STATIC_FILE_PATH_NO_WRAPPER,
  MESSAGE_POST_STATUS,
  ROLES_NAME_MAP,
  PRODUCTION_DOMAIN,
  FFMPEG_VERSION,
  SCHEDULE_STATUS,
  SCREEN_TYPE,
  SCREEN_MOCK_CONFIG_DATA_TYPE,
  SCREEN_MOCK_CONFIG_DATE_TYPE,
  SCREEN_MOCK_CONFIG_ADDRESS_TYPE,
  SCREEN_MOCK_CONFIG_LANGUAGE_TYPE,
  SCREEN_MOCK_CONFIG_NAME_TYPE,
  SCREEN_MOCK_CONFIG_TEXT_TYPE,
  THIRD_PARTY_AUTH_TOKEN_CONFIG_PATH,
  THIRD_PARTY_REQUEST_METHOD,
  THIRD_PARTY_REQUEST_PARAMS_TYPE
}