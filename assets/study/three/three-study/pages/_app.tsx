//entry
import React from 'react'
import App, { AppContext, AppProps, AppInitialProps } from 'next/app'
import { Provider } from 'mobx-react'
import Layout from '@/components/Layout'
import { initializeStore, Store } from '@/store'
import './index.less'

export default class MyApp extends App<AppProps> {

  constructor(props: any) {
    super(props)
    // Comment 2
    const isServer = typeof window === 'undefined'
    this.store = isServer ? props.initialState : initializeStore(props.initialState)
  }

  store!: Store

  // App组件的getInitialProps比较特殊
  // 能拿到一些额外的参数
  // Component: 被包裹的组件
  static async getInitialProps(appContext: AppContext) {
    const { Component, ctx } = appContext
    let pageProps = {};
    (ctx as any).store = initializeStore()

    // 拿到Component上定义的getInitialProps
    if (Component.getInitialProps) {
      // 执行拿到返回结果
      pageProps = await Component.getInitialProps(ctx)
    }

    // 返回给组件
    return {
      pageProps,
      initialState: (ctx as any).store
    } as AppInitialProps
  }

  render() {
    // Component就是我们要包裹的页面组件
    const { Component, pageProps } = this.props
    return (
      <Provider
        {...this.store}
      >
        <Layout>
          {/* @ts-ignore */}
          <Component {...pageProps}></Component>
        </Layout>
      </Provider>
    )
  }
}

