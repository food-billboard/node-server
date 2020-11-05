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
  FeedbackModel,
  mergeConfig
} = require('@src/utils')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { expect } = require('chai')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

//用户创建
function mockCreateUser(values={}) {
  const password = '1234567890'
  const mobile = values.mobile || parseInt(`13${new Array(9).fill(0).map(_ => Math.floor(Math.random() * 10)).join('')}`)
  const encodedPwd = encoded(password)
  const token = signToken({ mobile, role: Array.isArray(values.roles) && !!values.roles.length ? values.roles[0] : 'SUPER_ADMIN' }, {expiresIn: '5s'})

  let baseModel = {
    mobile,
    email: `${mobile}@163.com`,
    password: encodedPwd,
    username: '测试默认名称',
    avatar: ObjectId('5edb3c7b4f88da14ca419e61'),
    hot: 0,
    fans: [],
    attentions: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    rate: [],
    allow_many: false,
    status: 'SIGNOUT',
    roles: [ 'SUPER_ADMIN' ]
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new UserModel(baseModel)

  return {
      model,
      decodePassword: password,
      token,
      signToken: () => {
        return signToken({ mobile, password: encodedPwd }, {expiresIn: '5s'})
      }
    }
}

//电影创建
function mockCreateMovie(values={}) {

  let baseModel = {
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
    images: [],
    tag: [],
    comment: [],
    glance: 0,
    author_description: '作者描述',
    author_rate: 0,
    author: ObjectId('8f63270f005f1c1a0d9448ca'),
    poster: ObjectId('8f63270f005f1c1a0d9448ca'),
    hot:0,
    rate_person: 0,
    total_rate: 0,
    source_type: 'ORIGIN',
    stauts: 'COMPLETE',
    related_to: [],
    same_film: []
  }

  baseModel = mergeConfig(baseModel, values, true)

  const model = new MovieModel(baseModel)

  return { model }
}

//创建评论
function mockCreateComment(values={}) {
  let baseModel = {
    source_type: 'movie',
    user_info: ObjectId('8f63270f005f1c1a0d9448ca'),
    source: ObjectId('8f63270f005f1c1a0d9448ca'),
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
  baseModel = mergeConfig(baseModel, values, true)
  const model = new CommentModel(baseModel)

  return { model }
}

//创建标签
function mockCreateTag(values={}) {
  let baseModel = {
    text: '测试标签内容',
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new TagModel(baseModel)

  return { model }
}

//创建专题
function mockCreateSpecial(values={}) {
  let baseModel = {
    movie: [],
    description: '关于测试专题的内容介绍',
    name: '测试专题名称',
  }
  baseModel = mergeConfig(baseModel, values)

  const model = new SpecialModel(baseModel)

  return { model }
}

//创建演员
function mockCreateActor(values={}) {
  let baseModel = {
    name: '测试演员名称',
    works: [],
    other: {
      another_name: '测试演员的其他名字',
      avatar: ObjectId('8f63270f005f1c1a0d9448ca')
    },
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new ActorModel(baseModel)

  return { model }
}

//创建导演
function mockCreateDirector(values={}) {
  let baseModel = {
    name: '测试导演名称',
    works: [],
    other: {
      another_name: '导演的其他名称',
    },
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new DirectorModel(baseModel)

  return { model }
}

//创建语言
function mockCreateLanguage(values={}) {
  let baseModel = {
    name: '测试语言名称'
  }
  baseModel = mergeConfig(baseModel, values)

  const model = new LanguageModel(baseModel)

  return { model }
}

//创建地区
function mockCreateDistrict(values={}) {
  let baseModel = {
    name: '测试地区名称'
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new DistrictModel(baseModel)
  
  return { model }
}

//创建图片
function mockCreateImage(values={}) {
  let baseModel = {
    name: '测试图片名称',
    src: '测试地址',
    auth: 'PUBLIC',
    origin_type: 'USER',
    info: {
      mime: 'jpg',
      status: 'COMPLETE',
      md5: '测试md5'
    },
  }

  baseModel = mergeConfig(baseModel, values, true)

  const model = new ImageModel(baseModel)

  return { model }
}

//创建视频
function mockCreateVideo(values={}) {
  let baseModel = {
    name: '测试视频名称',
    src: '',
    auth: 'PUBLIC',
    origin_type: 'USER',
    info: {
      mime: 'mp4',
      status: 'COMPLETE',
      md5: '测试md5'
    },
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new VideoModel(baseModel)

  return { model }
}

//创建分类
function mockCreateClassify(values={}) {
  let baseModel = {
    name: '测试分类名称',
    glance: 0,
    icon: ObjectId('8f63270f005f1c1a0d9448ca')
  }

  baseModel = mergeConfig(baseModel, values, true)

  const model = new ClassifyModel(baseModel)

  return { model }
}

//创建全局信息
function mockCreateGlobal(values={}) {
  let baseModel = {
    notice: '测试的首页notice内容',
    info: '测试的小程序相关信息内容',
  }

  baseModel = mergeConfig(baseModel, values, true)

  const model = new GlobalModel(baseModel)

  return { model }
}

//创建弹幕
function mockCreateBarrage(values={}) {
  let baseModel = {
    like_users: [],
    time_line: 100,
    origin: ObjectId('8f63270f005f1c1a0d9448ca'),
    user: ObjectId('8f63270f005f1c1a0d9448ca'),
    content: '测试弹幕'
  }

  baseModel = mergeConfig(baseModel, values, true)

  const model = new BarrageModel(baseModel)

  return { model }
}

//创建反馈
function mockCreateFeedback(values) {
  let baseModel = {
    content: {
      text: '111',
      image: [],
      video: []
    }
  }

  baseModel = mergeConfig(baseModel, values, true)

  const model = new FeedbackModel(baseModel)
  return { model }
}

//创建排行榜
function mockCreateRank(values) {
  let baseModel = {
    name: '111',
    glance: 10,
    match_field: {
      _id: ObjectId('8f63270f005f1c1a0d9448ca'),
      field: 'classify'
    },
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new RankModel(baseModel)
  return { model }
}

//创建查询参数etag
function createEtag(query={}) {
  return Object.keys(query).reduce((acc, cur) => {
    const str = `${cur}=${query[cur]}`
    const encode = encoded(str)
    acc += `,${encode}`
    return acc
  }, '')
  .slice(1)
}

const _satisfies_ = Symbol('satisfies')

//常规通用的断言方法
const commonValidate = {
  [_satisfies_]: (valid, target, satisfies) => !!satisfies && typeof satisfies === 'function' ? satisfies(target) : valid,
  string(target, satisfies) {
    expect(target).to.be.a('string').and.to.satisfies((target) => {
      return this[_satisfies_](target.length > 0, target, satisfies)
    })
  },
  objectId(target, satisfies){
    expect(target).to.be.satisfies((target) => {
      return this[_satisfies_](ObjectId.isValid(target), satisfies)
    })
  },
  number(target, satisfies){ expect(target).to.be.a('number').and.that.satisfies((target) => {
    return this[_satisfies_](!Number.isNaN(target) && target >= 0, satisfies)
  })},
  date(target, satisfies){
    expect(target).to.be.satisfies((target) => {
    return this[_satisfies_](typeof target == 'number' ? target > 0 : Object.prototype.toString.call(new Date(target)) === '[object Date]', satisfies)
  })},
  poster(target, satisfies){
    expect(target).to.be.satisfies((target) => {
    return this[_satisfies_](target == null ? true : ( typeof target === 'string' && !!target.length ), satisfies)
  })},
  time(...args) {
    this.date(...args)
  }
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
  mockCreateRank,
  Request,
  createEtag,
  commonValidate,
  mockCreateFeedback
}