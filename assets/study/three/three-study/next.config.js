const withAntdLess = require('next-plugin-antd-less');

module.exports = {
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
      }
    },
    // Other Config Here...
    webpack(config) {
      return config 
    },

  }),
  webpack5: false 
}
