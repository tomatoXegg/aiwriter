import React from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Header, Content, Sider } = AntLayout;

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="light">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{ margin: 0, color: '#1677ff' }}>AI Writer</h2>
        </div>
      </Sider>
      
      <AntLayout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>内容创作平台</h1>
          </div>
        </Header>
        
        <Content style={{ 
          margin: '24px',
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 280
        }}>
          {children || <Outlet />}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};