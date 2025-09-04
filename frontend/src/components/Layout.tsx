import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space, Button, Badge } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  FolderOutlined,
  EditOutlined,
  FileTextOutlined,
  CheckOutlined,
  SettingOutlined as SettingIcon,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentAccount } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/dashboard',
      label: '仪表板',
      icon: <DashboardOutlined />,
    },
    {
      key: '/accounts',
      label: '账号管理',
      icon: <TeamOutlined />,
    },
    {
      key: '/materials',
      label: '素材管理',
      icon: <FolderOutlined />,
    },
    {
      key: 'workflow',
      label: '创作工作流',
      icon: <EditOutlined />,
      children: [
        {
          key: '/topics',
          label: '选题整合',
          icon: <FileTextOutlined />,
        },
        {
          key: '/content',
          label: '内容生成',
          icon: <EditOutlined />,
        },
        {
          key: '/review',
          label: '内容审查',
          icon: <CheckOutlined />,
        },
      ],
    },
    {
      key: '/content-list',
      label: '内容管理',
      icon: <FileTextOutlined />,
    },
    {
      key: '/settings',
      label: '设置',
      icon: <SettingIcon />,
    },
  ];

  const getCurrentPath = () => {
    const path = location.pathname;
    // 检查是否是工作流子路径
    if (['/topics', '/content', '/review'].includes(path)) {
      return '/workflow';
    }
    return path;
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginRight: 16 }}
          />
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
            AI Writer
          </div>
        </div>
        
        <Space>
          <Badge count={3} size="small">
            <Button type="text" icon={<BellOutlined />} />
          </Badge>
          
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
      </Header>
      
      <AntLayout>
        <Sider 
          width={250} 
          style={{ background: '#fff' }}
          collapsed={collapsed}
          collapsedWidth={80}
        >
          <Menu
            mode="inline"
            selectedKeys={[getCurrentPath()]}
            defaultOpenKeys={['/workflow']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => {
              if (key !== 'workflow') {
                navigate(key);
              }
            }}
          />
        </Sider>
        
        <Content style={{ 
          margin: '24px', 
          minHeight: 280,
          background: '#fff',
          borderRadius: '8px',
          padding: '24px'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;