import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Router from 'next/router'
import { Button, Layout as AntLayout, Menu } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons'
import router, { TRouter } from '@/config/router'
import './index.less'

const { Header, Sider, Content } = AntLayout

const Layout = ({ children }: { children: React.ReactChildren }) => {

  const [ collapsed, setCollapsed ] = useState<boolean>(false)

  const toggle = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed])

  const onRouterPush = useCallback(({ item, key, keyPath, domEvent }) => {
    return Router.push(key)
  }, [])

  const MenuList = useMemo(() => {
    const renderList = (router: TRouter[]) => {
      return router.filter(item => !item.hideInMenu).map((item, index) => {
        const { path, routes, title, icon } = item 
        let newRoutes = []
        if(Array.isArray(routes)) {
          newRoutes = routes.filter(item => !item.hideInMenu)
          if(!!newRoutes.length) return (
            <Menu.SubMenu
              key={path}
              // icon={<icon />}
              title={title}
            >
              {renderList(newRoutes)}
            </Menu.SubMenu>
          )
        }
        return (
          <Menu.Item
            key={path}
            icon={icon}
          >
            {title}
          </Menu.Item>
        )
      })
    }
    return (
      <Menu 
        theme="dark" 
        mode="inline" 
        defaultSelectedKeys={['/home']}
        onClick={onRouterPush}
      >
        {
          renderList(router)
        }
      </Menu>
    )
  }, [onRouterPush])

  useEffect(() => {
    const { asPath } = Router
    if(asPath === '/') {
      Router.push('/home')
    }
    
  }, [])

  return (
    <AntLayout
      style={{
        height: '100vh'
      }}
    >
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" />
        {
          MenuList
        }
      </Sider>
      <AntLayout className="site-layout">
        <Header className="site-layout-background-header" style={{ padding: 0 }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggle,
          })}
        </Header>
        <Content
          className="site-layout-background"
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            height: 'calc(100vh - 64px)',
            overflow: 'auto'
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )

}

export default Layout