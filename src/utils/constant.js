const path = require('path')

const EMAIL_AUTH = {
  pass: 'hgldcifqqwmlbajd',
  username: 'G',
  email: '944745590@qq.com'
}

//邮箱正则
const EMAIL_REGEXP = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/

//静态资源目录
const STATIC_FILE_PATH = path.resolve(__dirname, '../../static')

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
  NOT_VERIFY: 'NOT_VERIFY'
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

const MEDIA_ORIGIN_TYPE = {
  USER: 'USER',
  SYSTEM: 'SYSTEM'
}

const NETWORK = 'localhost'

//关键词抽取个数
const EXTRACT_KEYWORD_TOP_N = 1

module.exports = {
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
  EXTRACT_KEYWORD_TOP_N
}