import React from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentAccount } = useAppStore();

  const userMenu = (
    <Menu>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        退出
      </Menu.Item>
    </Menu>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
            AI Writer
          </div>
          <Space>
            {currentAccount && (
              <span style={{ color: '#666' }}>
                当前账号: {currentAccount.name}
              </span>
            )}
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>用户</span>
              </Space>
            </Dropdown>
          </Space>
        </div>
      </Header>
      
      <AntLayout>
        <Sider width={250} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: 'dashboard',
                label: '仪表板',
              },
              {
                key: 'accounts',
                label: '账号管理',
              },
              {
                key: 'materials',
                label: '素材管理',
              },
              {
                key: 'workflow',
                label: '创作工作流',
                children: [
                  {
                    key: 'topics',
                    label: '选题整合',
                  },
                  {
                    key: 'content',
                    label: '内容生成',
                  },
                  {
                    key: 'review',
                    label: '内容审查',
                  },
                ],
              },
              {
                key: 'content-list',
                label: '内容管理',
              },
              {
                key: 'settings',
                label: '设置',
              },
            ]}
          />
        </Sider>
        
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;