const { 
  encoded, 
  signToken,
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
  BarrageModel, 
} = require('@src/utils')
const App = require('../app')
const Request = require('supertest').agent(App.listen())

const is = (value, type) => Object.prototype.toString.call(value) === `[object ${type.toUpperCase().slice(0, 1)}${type.toLowerCase().slice(1)}]`

function mergeConfig(origin, target) {
  let _obj = {...origin}
  if(typeof _obj !== 'object') return _obj
  Object.keys(_obj).forEach(item => {
    if(_obj[item] != undefined && target[item] != undefined) {
      if(!is(_obj[item], 'object')) {
        _obj[item] = target[item]
      }else {
        _obj[item] = mergeConfig(_obj[item], target[item])
      }
    }
  })
  return _obj
}

//用户创建
function mockCreateUser(values={}) {
  const password = '1234567890'
  const mobile = 18368003190
  const encodedPwd = encoded(password)
  const token = signToken({ mobile, password: encodedPwd })

  const baseModel = {
    mobile,
    password: encodedPwd
  }
  mergeConfig(baseModel, values)

  const model = new UserModel(baseModel)

  return {
      ...model,
      decodePassword: password,
      token
    }
}

//电影创建
function mockCreateMovie(values={}) {
  const baseModel = {
    name: '测试电影名称',
    info: {
      name: '测试电影名称',
      another_name: ['其他名字'],
      description: '测试电影的相关内容简介',
      actor: [],
      director: [],
      district: [],
      classify: [],
      screen_time: new Date(),
      language: []
    },
    video: '',
    images: [],
    poster: '',
    tag: [],
    comment: [],
    author: '',
    glance: 0,
    author_description: '作者描述',
    author_rate: 0,
    hot:0,
    rate_person: 0,
    total_rate: 0,
    source_type: 'ORIGIN',
    stauts: 'COMPLETE',
    related_to: [],
    same_film: []
  }
  mergeConfig(baseModel, values)

  const model = new MovieModel(baseModel)

  return model
}

//创建评论
function mockCreateComment(values={}) {
  const baseModel = {
    source_type: 'movie',
    source: '',
    user_info: '',
    sub_comments: [],
    total_like: 0,
    like_person: [],
    content: {
      text: '评论的文字内容',
      video: [],
      image: []
    },
    comment_users: []
  }
  mergeConfig(baseModel, vlaues)
  const model = new CommentModel(baseModel)

  return model
}

//创建标签
function mockCreateTag(values={}) {
  const baseModel = {
    text: '测试标签内容',
  }
  mergeConfig(baseModel, values)

  const model = new TagModel(baseModel)

  return model
}

//创建专题
function mockCreateSpecial(values={}) {
  const baseModel = {
    movie: [],
    poster: '',
    description: '关于测试专题的内容介绍',
    name: '测试专题名称',
  }
  mergeConfig(baseModel, values)

  const model = new SpecialModel(baseModel)

  return model
}

//创建演员
function mockCreateActor(values={}) {
  const baseModel = {
    name: '测试演员名称',
    works: [],
    other: {
      another_name: '测试演员的其他名字',
      avatar: ''
    },
  }
  mergeConfig(baseModel, values)

  const model = new ActorModel(baseModel)

  return model
}

//创建导演
function mockCreateDirector(values={}) {
  const baseModel = {
    name: '测试导演名称',
    works: [],
    other: {
      another_name: '导演的其他名称',
      avatar: ''
    },
  }
  mergeConfig(baseModel, values)

  const model = new DirectorModel(baseModel)

  return model
}

//创建语言
function mockCreateLanguage(values={}) {
  const baseModel = {
    name: '测试语言名称'
  }
  mergeConfig(baseModel, values)

  const model = new LanguageModel(baseModel)

  return model
}

//创建地区
function mockCreateDistrict(values={}) {
  const baseModel = {
    name: '测试地区名称'
  }
  mergeConfig(baseModel, values)

  const model = new DistrictModel(baseModel)
  
  return model
}

//创建图片
function mockCreateImage(values={}) {
  const baseModel = {
    name: '测试图片名称',
    src: '',
    origin_type: 'SYSTEM',
    origin: '',
    auth: 'PUBLIC',
    info: {
      mime: 'jpg',
      status: 'COMPLETE'
    },
  }
  mergeConfig(baseModel, values)

  const model = new ImageModel(baseModel)

  return model
}

//创建视频
function mockCreateVideo(values={}) {
  const baseModel = {
    name: '测试视频名称',
    src: '',
    poster: '',
    origin_type: 'SYSTEM',
    origin: '',
    auth: 'PUBLIC',
    info: {
      mime: 'mp4',
      status: 'COMPLETE'
    },
  }
  mergeConfig(baseModel, values)

  const model = new VideoModel(baseModel)

  return model
}

//创建分类
function mockCreateClassify(values={}) {
  const baseModel = {
    name: '测试分类名称',
    icon: '',
    match: [],
    glance: 0
  }
  mergeConfig(baseModel, values)

  const model = new ClassifyModel(baseModel)

  return model
}

//创建全局信息
function mockCreateGlobal(values={}) {
  const baseModel = {
    notice: '测试的首页notice内容',
    info: '测试的小程序相关信息内容',
  }
  mergeConfig(baseModel, values)

  const model = new GlobalModel()

  return model
}

//创建弹幕
function mockCreateBarrage(values) {
  let baseModel = {
    origin: '',
    user: '',
    like_users: [],
    time_line: 100
  }

  const newModel = mergeConfig(baseModel, values)

  const model = new BarrageModel(newModel)

  return model
}

module.exports = {
  mockCreateUser,
  mockCreateMovie,
  mockCreateComment,
  mockCreateTag,
  mockCreateSpecial,
  mockCreateActor,
  mockCreateDirector,
  mockCreateLanguage,
  mockCreateDistrict,
  mockCreateImage,
  mockCreateVideo,
  mockCreateClassify,
  mockCreateGlobal,
  mockCreateBarrage,
  Request
}