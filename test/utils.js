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

//用户创建
function mockCreateUser() {
  const password = '1234567890'
  const mobile = 18368003190
  const encodedPwd = encoded(password)
  const token = signToken({ mobile, password: encodedPwd })
  return {
    password,
    mobile,
    token,
    beforeEach: function(done) {
      const model = new UserModel({
        mobile,
        password: encodedPwd
      })
      model
      .save()
      .then(done)
    },
    afterEach: function(done) {
      UserModel.remove({ mobile })
    }
  }
}

//电影创建
function mockCreateMovie() {
  const model = new MovieModel({
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
  })
}

//创建评论
function mockCreateComment() {
  const model = new CommentModel({
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
  })
}

//创建标签
function mockCreateTag() {
  const model = new TagModel({
    text: '测试标签内容',
  })
}

//创建专题
function mockCreateSpecial() {
  const model = new SpecialModel({
    movie: [],
    poster: '',
    description: '关于测试专题的内容介绍',
    name: '测试专题名称',
  })
}

//创建演员
function mockCreateActor() {
  const model = new ActorModel({
    name: '测试演员名称',
    works: [],
    other: {
      another_name: '测试演员的其他名字',
      avatar: ''
    },
  })
}

//创建导演
function mockCreateDirector() {
  const model = new DirectorModel({
    name: '测试导演名称',
    works: [],
    other: {
      another_name: '导演的其他名称',
      avatar: ''
    },
  })
}

//创建语言
function mockCreateLanguage() {
  const model = new LanguageModel({
    name: '测试语言名称'
  })
}

//创建地区
function mockCreateDistrict() {
  const model = new DistrictModel({
    name: '测试地区名称'
  })
}

//创建图片
function mockCreateImage() {
  const model = new ImageModel({
    name: '测试图片名称',
    src: '',
    origin_type: 'SYSTEM',
    origin: '',
    auth: 'PUBLIC',
    info: {
      mime: 'jpg',
      status: 'COMPLETE'
    },
  })
}

//创建视频
function mockCreateVideo() {
  const model = new VideoModel({
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
  })
}

//创建分类
function mockCreateClassify() {
  const model = new ClassifyModel({
    name: '测试分类名称',
    icon: '',
    match: [],
    glance: 0
  })
}

//创建全局信息
function mockCreateGlobal() {
  const model = new GlobalModel({
    notice: '测试的首页notice内容',
    info: '测试的小程序相关信息内容',
  })
}

//创建弹幕
function mockCreateBarrage() {
  const model = new BarrageModel({
    origin: '',
    user: '',
    like_users: [],
    time_line: 100
  })
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
  mockCreateBarrage
}