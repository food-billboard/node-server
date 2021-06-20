import React from 'react'
import { Result } from 'antd'

export default () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="对不起，该页面不存在"
    />
  )
}