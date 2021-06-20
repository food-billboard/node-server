const withAntdLess = require('next-plugin-antd-less');

module.exports = {
  // 输出目录
  distDir: 'dist',
  // 是否每个路由生成Etag
  generateEtags: true,
  // 本地开发时对页面内容的缓存
  onDemandEntries: {
    // 内容在内存中缓存的时长(ms)
    maxInactiveAge: 25 * 1000,
    // 同时缓存的页面数
    pagesBufferLength: 2,
  },
  // 在pages目录下会被当做页面解析的后缀
  pageExtensions: ['jsx', 'js', 'ts', 'tsx'],
  //  // 配置buildId
  //  generateBuildId: async () => {
  //   if (process.env.YOUR_BUILD_ID) {
  //     return process.env.YOUR_BUILD_ID
  //   }
  //   // 返回null默认的 unique id
  //   return null
  // },
  // 手动修改webpack配置
  webpack(config, options) {
    return config
  },
  // 手动修改webpackDevMiddleware配置
  webpackDevMiddleware(config) {
    return config
  },
  // 可以在页面上通过process.env.customkey 获取 value
  env: {
    CODE: 'development',
    // CODE: 'production',
  },
  // 下面两个要通过 'next/config' 来读取
  // 可以在页面上通过引入 import getConfig from 'next/config'来读取

  // 只有在服务端渲染时才会获取的配置
  serverRuntimeConfig: {
    mySecret: 'secret',
    secondSecret: process.env.SECOND_SECRET,
  },
  // 在服务端渲染和客户端渲染都可获取的配置
  publicRuntimeConfig: {
    staticFolder: '/static',
  },
  ...withAntdLess({
    // optional
    modifyVars: { '@primary-color': '#04f' },
    // optional
    // lessVarsFilePath: './src/styles/variables.less',
    // optional
    lessVarsFilePathAppendToEndOfContent: false,
    // optional https://github.com/webpack-contrib/css-loader#object
    // cssLoaderOptions: {
    //   esModule: false,
    //   sourceMap: false,
    //   modules: {
    //     mode: 'local',
    //   },
    // },
    lessLoaderOptions: {
      // javascriptEnabled: true,
      lessOptions: {
        javascriptEnabled: true,
        modifyVars: {
          "@primary-color": "#1890ff"
        }
      }
    },
    // Other Config Here...
    webpack(config) {
      return config 
    },

  }),
  webpack5: false 
}
