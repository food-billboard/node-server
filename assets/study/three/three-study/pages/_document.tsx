/** 
 * 只有在服务端渲染的时候才会被调用
 * 用来修改服务端渲染的文档内容
 * 一般用来配合第三方 css in js 方案使用
*/
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

export default class CustomDocument extends Document {

  static async getInitialProps(ctx: any) {
    const sheet = new ServerStyleSheet()
    // 劫持原本的renderPage函数并重写
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          // 根App组件
          enhanceApp: (App: any) => (props: any) => sheet.collectStyles(<App {...props} />),
        })
      // 如果重写了getInitialProps 就要把这段逻辑重新实现
      const props = await Document.getInitialProps(ctx)
      return {
        ...props,
        styles: (
          <>
            {props.styles}
            {sheet.getStyleElement()}
          </>
        ),
      }
    } finally {
      sheet.seal()
    }
  }

  render() {
    return (
      <Html>
        <Head>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}