const { 
  encoded, 
  signToken,
  UserModel,
  GlobalModel,
  RoomModel,
  MessageModel,
  MemberModel,
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
  BehaviourModel,
  mergeConfig,
  FriendsModel,
  ROOM_USER_NET_STATUS,
  MESSAGE_MEDIA_TYPE,
  ROOM_TYPE,
  MESSAGE_TYPE
} = require('@src/utils')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { expect } = require('chai')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const fsPromise = fs.promises
const { Types: { ObjectId } } = mongoose

function createMobile() {
  return parseInt(`13${new Array(9).fill(0).map(_ => Math.floor(Math.random() * 10)).join('')}`)
}

//用户创建
function mockCreateUser(values={}) {
  const password = '1234567890'
  const mobile = values.mobile || createMobile()
  const encodedPwd = encoded(password)
  // const token = signToken({ mobile, id }, {expiresIn: '5s'})
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
      // token,
      signToken: (id) => {
        return signToken({ mobile, id }, { expiresIn: '5s' })
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
    images: new Array(6).fill(ObjectId('8f63270f005f1c1a0d9448ca')),
    video: ObjectId('8f63270f005f1c1a0d9448ca'),
    tag: [],
    comment: [],
    glance: 0,
    author_description: '作者描述',
    author_rate: 0,
    author: ObjectId('8f63270f005f1c1a0d9448ca'),
    poster: ObjectId('8f63270f005f1c1a0d9448ca'),
    hot:0,
    rate_person: 1,
    total_rate: 0,
    source_type: 'ORIGIN',
    status: 'COMPLETE',
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
    valid: true
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
    origin: ObjectId('5edb3c7b4f88da14ca419e61'),
    poster: ObjectId('5edb3c7b4f88da14ca419e61'),
    valid: false,
  }
  baseModel = mergeConfig(baseModel, values, true)
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
  baseModel = mergeConfig(baseModel, values, true)

  const model = new LanguageModel(baseModel)

  return { model }
}

//创建地区
function mockCreateDistrict(values={}) {
  let baseModel = {
    name: '测试地区名称',
  }
  baseModel = mergeConfig(baseModel, values, true)

  const model = new DistrictModel(baseModel)
  
  return { model }
}

//创建图片
function mockCreateImage(values={}) {
  let baseModel = {
    name: '测试图片名称',
    src: '测试地址' + Math.random(),
    auth: 'PUBLIC',
    origin_type: 'USER',
    origin: ObjectId('8f63270f005f1c1a0d9448ca'),
    info: {
      mime: 'jpg',
      status: 'COMPLETE',
      md5: '测试md5',
      size: 100
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
    origin: ObjectId('8f63270f005f1c1a0d9448ca'),
    info: {
      mime: 'mp4',
      status: 'COMPLETE',
      md5: '测试md5',
      size: 1024 * 1024
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
    visit_count: 0,
    valid: false,
    origin: ObjectId('571094e2976aeb1df982ad4e')
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
    },
    status: 'DEALING',
    user_info: ObjectId('8f63270f005f1c1a0d9448ca')
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

//创建行为
function mockCreateBehaviour(values) {
  let baseModel = {
    timestamps: Date.now(),
    url_type: 'USER_GET',
    user: ObjectId('8f63270f005f1c1a0d9448ca'),
    target: ObjectId('8f63270f005f1c1a0d9448ca')
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new BehaviourModel(baseModel)
  return { model }
}

function mockCreateFriends(values) {
  let baseModel = {
    user: ObjectId('8f63270f005f1c1a0d9448ca'),
    friends: []
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new FriendsModel(baseModel)
  return { model }
}

//创建成员
function mockCreateMember(values) {
  let baseModel = {
    user: ObjectId('8f63270f005f1c1a0d9448ca'),
    status: ROOM_USER_NET_STATUS.OFFLINE,
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new MemberModel(baseModel)
  return { model }
}

//创建消息
function mockCreateMessage(values) {
  let baseModel = {
    message_type: MESSAGE_TYPE.USER,
    user_info: ObjectId('8f63270f005f1c1a0d9448ca'),
    point_to: ObjectId('8f63270f005f1c1a0d9448ca'),
    media_type: MESSAGE_MEDIA_TYPE.TEXT,
    room: ObjectId('8f63270f005f1c1a0d9448ca'),
    content: {
      text: '测试消息内容'
    },
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new MessageModel(baseModel)
  return { model }
}

//创建房间
function mockCreateRoom(values) {
  let baseModel = {
    type:  ROOM_TYPE.CHAT,
    origin: false,
    create_user: ObjectId('8f63270f005f1c1a0d9448ca'),
    info: {
      avatar: ObjectId('5edb3c7b4f88da14ca419e61'),
      name: '测试房间名称',
      description: '测试房间描述'
    },
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new RoomModel(baseModel)
  return { model }
}

//创建搜索
function mockCreateSearch(values) {
  let baseModel = {
    key_word: '测试关键词',
    match_movies: [],
    match_texts: [],
    hot: [],
  }

  baseModel = mergeConfig(baseModel, values, true)
  const model = new SearchModel(baseModel)
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
  number(target, satisfies){ expect(parseInt(target)).to.be.a('number').and.that.satisfies((target) => {
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

//生成临时静态文件
async function generateTemplateFile(files=[
  {
    size: 1024 * 1024 * 6,
    type: 'mp4',
    name: 'test-video.mp4'
  }, 
  {
    size: 1024 * 3,
    type: 'png',
    name: 'test-image.png'
  }, 
  {
    size: 1024 * 1024 * 2.3,
    type: 'jpg',
    name: 'test-big.jpg'
  }
]) {
  const dir = path.join(__dirname, 'assets')
  if(!fs.existsSync(dir)) fs.mkdirSync(dir)
  for(let i = 0; i < files.length; i ++) {
    const { size, type, name: fileName } = files[i]
    const filePath = path.join(dir, `${fileName}`)
    try {
      const exists = fs.existsSync(filePath)
      if(!exists) {
        const buffer = Buffer.alloc(size, 'a')
        await fsPromise.writeFile(filePath, buffer)
        // const writeStream = fs.createWriteStream(filePath)
        // await new Promise((resolve, reject) => {
        //   writeStream.on('finish', resolve)
        //   writeStream.on('error', reject)
        //   writeStream.on('close', resolve)
        //   const buffer = Buffer.alloc(size, 'a')
        //   writeStream.write(buffer)
        // })
      }
    }catch(err) {
      console.error(err)
    }
  }
  
  return files

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
  mockCreateBehaviour,
  mockCreateSearch,
  Request,
  createEtag,
  commonValidate,
  mockCreateFeedback,
  generateTemplateFile,
  createMobile,
  mockCreateFriends,
  mockCreateMember,
  mockCreateMessage,
  mockCreateRoom
}