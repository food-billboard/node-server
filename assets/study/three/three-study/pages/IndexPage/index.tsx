import React, { Component } from 'react'

interface IProps {

}

interface IState {

}

class IndexPage extends Component<IProps, IState> {

  /**
   *getInitialProps 的作用非常强大，它可以帮助我们同步服务端和客户端的数据，我们应该尽量把数据获取的逻辑放在 getInitialProps 里，它可以：
   * 在页面中获取数据
   * 在 App 中获取全局数据
   * 会被当做props传递
   */
  static getInitialProps = async () => {
    const result = Promise.resolve({ test: 'hello world' })
    await new Promise(resolve => setTimeout(resolve, 1000))
    return result
  }

  render = () => {
    return (
      <div>IndexPage</div>
    )
  }

}

export default IndexPage