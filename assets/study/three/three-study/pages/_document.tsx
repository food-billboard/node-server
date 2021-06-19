/** 
 * 只有在服务端渲染的时候才会被调用
 * 用来修改服务端渲染的文档内容
 * 一般用来配合第三方 css in js 方案使用
*/
import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class CustomDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <title></title>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}