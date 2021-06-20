import React, { Component } from 'react'
import dynamic from 'next/dynamic'
import styled from 'styled-components'
import Router from 'next/router'

//异步加载组件
const Body = dynamic(import('./components/Body'))

const Title = styled.h1`
  color: yellow;
  font-size: 40px;
`

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
    //异步加载模块
    const moment = await import('moment')
    const result = Promise.resolve({ 
      test: 'hello world',
      moment
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    return result
  }

  render = () => {
    return (
      <div>
        IndexPage
        <div className="hello" onClick={() => {
          Router.push('/home/subhome')
        }}>
          Css in Js 
        </div>
        <Title>
          Style Component
        </Title>
        <Body />
      </div>
    )
  }

}

export default IndexPage