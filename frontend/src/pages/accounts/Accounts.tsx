import React, { useState } from 'react';
import { Tabs, Card, Button, Space } from 'antd';
import { TableOutlined, BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import AccountList from '../../components/accounts/AccountList';
import AccountStats from '../../components/accounts/AccountStats';
import { useAccountStore } from '../../store';

const { TabPane } = Tabs;

const Accounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { fetchAccounts, fetchStats, fetchActivity, loading } = useAccountStore();

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 根据标签页刷新相应数据
    if (key === 'list') {
      fetchAccounts();
    } else if (key === 'stats') {
      fetchStats();
      fetchActivity();
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'list') {
      fetchAccounts();
    } else if (activeTab === 'stats') {
      fetchStats();
      fetchActivity();
    }
  };

  const tabItems = [
    {
      key: 'list',
      label: (
        <Space>
          <TableOutlined />
          账号列表
        </Space>
      ),
      children: <AccountList />,
    },
    {
      key: 'stats',
      label: (
        <Space>
          <BarChartOutlined />
          统计分析
        </Space>
      ),
      children: <AccountStats />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="账号管理"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          type="card"
        />
      </Card>
    </div>
  );
};

export default Accounts;