const axios = require('axios')
const { debounce } = require('lodash')
const { stringify } = require('querystring')
const Qs = require('qs')

// 处理query 传参的时候导致的空字符串查询问题（后端不愿意给处理）
const formatQuery = (query = {})=>{
  let ret = {}
  Object.keys(query).map((key)=>{
    if( query[key] !== null && query[key] !== undefined && query[key]!=='' ){
      ret[key] = query[key]
    }
  })
  return ret
}

const DEFAULT_REQUEST_SETTING= {
  // baseURL: '',
  transformRequest: [function (data, headers) {
    return data
  }],
  transformResponse: [function (data) {
    return data
  }],
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  paramsSerializer: function (params) {
    return Qs.stringify(params, {arrayFormat: 'brackets'})
  },
  timeout: 10000,
  withCredentials: true,
  responseType: 'json',
}

const axiosInstance = axios.create(DEFAULT_REQUEST_SETTING)

// axiosInstance.interceptors.request.use(
//   config => {

//     return config
//   },
//   error => {
//     // 处理请求错误
//     // console.log(error)
//     return Promise.reject(error)
//   }
// )

// axiosInstance.interceptors.response.use(

//   /**
//    * 通过自定义代码确定请求状态
//    */
//   response => {
//     const res = response.data
//     // 这里的error是后台返回给我的固定数据格式 可根据后端返回数据自行修改
//     const { error } = res;
//     // error不为null
//     if (error) {

//       // 弹出报错信息
//       Toast.fail({
//         icon: 'failure',
//         message: error.msg
//       })

//       // 后端返回code的报错处理
//       switch (error.code) {
//         case '1000':
//         case '1001':
//         case '1002':
//         case '1003':
//           router.replace({ path: '/error', query: { code: error.code, msg: error.msg } })
//           break;
//         case '6000':
//         case '6100':
//           // 清空Token 重新登录
//           store.dispatch('user/resetToken')
//           return Promise.reject(new Error(error.msg));
//         case '6200':
//         case '7000':
//         case '19000':
//         default:
//           // 如果状态码不是 则判断为报错信息
//           return Promise.reject(new Error(error.msg))
//       }
//     } else {
//       // 正常返回
//       return res
//     }

//   },
//   error => {
//     // 这里就是status网络请求的报错处理 主要处理300+ 400+ 500+的状态
//     console.error('err：' + error)
//     return Promise.reject(error)
//   }
// )

const request = async (url, setting={}) => {
    // 过滤URL参数
    const { params, data, mis=true, ...options } = setting

    let body
    let error
  
    try{
      body = await axiosInstance(url, {
        ...options,
        ...(data ? { data: Qs.stringify(data) } : {}),
        ...(params ? { params: formatQuery(params) } : {}),
      })
    } catch(err) {
      console.log(err, 2333)
      error = {
        status: err.response.status,
        errMsg: err.response.statusText
      }
    }
  
    // 报错分为两种，
    // 系统错误，由 httpClient 拦截到的错误 如，4xx，5xx
    if( error ){
      error.errorType = 'system';
      error.messageType = 'response';
      mis && misManage(error);
      throw error
    }
  
    // 业务错误，客户端返回的 statusCode === 200 但是response.body 中的success 返回为 false的错误
    if( body && body.data.success === false ) {
      error = body
      error.errorType = 'logic'
      error.messageType = 'body'
    }
  
    // 返回真正的response body res 内容
    if( !error ){
      return (body.data || {})
    }
    error.mis = mis
    mis && misManage(error)
    throw error
}
  
  // 处理报错
const misManage = (error) => {
  if( error.messageType === 'body' ){
    const err = error.err || {}

    // 未登录处理
    if( error.errorType === 'system' && err.code === '401' ){
      return dispatchLogin(err);
    }
    // message.error(err.msg || '网络错误');
    return
  }
  const { response } = error;
  if( response && response.status === 401 ){
    return dispatchLogin(error);
  }
  if (response && response.status) {
    // const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    // notification.error({
    //   message: `请求错误 ${status}: ${url}`,
    //   description: errorText,
    // });
  } else if (!response) {
    // notification.error({
    //   description: '您的网络发生异常，无法连接服务器',
    //   message: '网络异常',
    // });
  }
}

module.exports = request