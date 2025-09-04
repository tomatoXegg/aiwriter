import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Timeline,
  List,
  Avatar,
  Button,
  Space,
  Tooltip,
  Badge,
  Select,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAccountStore } from '../../store';
import type { Account } from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AccountStats: React.FC = () => {
  const {
    stats,
    activity,
    loading,
    error,
    fetchStats,
    fetchActivity,
    clearError,
  } = useAccountStore();

  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchStats();
    fetchActivity();
  }, []);

  useEffect(() => {
    if (error) {
      console.error('统计数据获取失败:', error);
      clearError();
    }
  }, [error]);

  const getPlatformIcon = (platform: string) => {
    const icons = {
      wechat: <UserOutlined style={{ color: '#52c41a' }} />,
      weibo: <UserOutlined style={{ color: '#f5222d' }} />,
      zhihu: <UserOutlined style={{ color: '#1890ff' }} />,
      other: <UserOutlined style={{ color: '#8c8c8c' }} />,
    };
    return icons[platform as keyof typeof icons] || icons.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#52c41a',
      inactive: '#8c8c8c',
      suspended: '#faad14',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Space>
          {getPlatformIcon(platform)}
          <span>
            {platform === 'wechat' && '微信公众号'}
            {platform === 'weibo' && '微博'}
            {platform === 'zhihu' && '知乎'}
            {platform === 'other' && '其他'}
          </span>
        </Space>
      ),
    },
    {
      title: '账号数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number, record: any) => (
        <div>
          <Statistic value={count} suffix="个" />
          {record.percentage && (
            <Progress
              percent={record.percentage}
              size="small"
              strokeColor={getStatusColor(record.platform)}
              showInfo={false}
            />
          )}
        </div>
      ),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => (
        <Tag color="blue">{percentage}%</Tag>
      ),
    },
  ];

  const activeColumns = [
    {
      title: '账号',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Account) => (
        <Space>
          {getPlatformIcon(record.platform)}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="blue">
          {platform === 'wechat' && '微信公众号'}
          {platform === 'weibo' && '微博'}
          {platform === 'zhihu' && '知乎'}
          {platform === 'other' && '其他'}
        </Tag>
      ),
    },
    {
      title: '内容数量',
      dataIndex: 'content_count',
      key: 'content_count',
      render: (count: number) => (
        <Badge count={count} showZero color="#1890ff" />
      ),
    },
    {
      title: '最后活跃',
      dataIndex: 'last_activity',
      key: 'last_activity',
      render: (date: string) => (
        <Tooltip title={date}>
          {new Date(date).toLocaleDateString()}
        </Tooltip>
      ),
    },
  ];

  const platformData = stats?.platformDistribution
    ? Object.entries(stats.platformDistribution).map(([platform, count]) => ({
        platform,
        count,
        percentage: Math.round((count / stats.totalAccounts) * 100),
      }))
    : [];

  return (
    <div>
      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总账号数"
              value={stats?.totalAccounts || 0}
              prefix={<UserOutlined />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃账号"
              value={stats?.activeAccounts || 0}
              prefix={<CheckCircleOutlined />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="停用账号"
              value={stats?.inactiveAccounts || 0}
              prefix={<CloseCircleOutlined />}
              suffix="个"
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="暂停账号"
              value={stats?.suspendedAccounts || 0}
              prefix={<PauseCircleOutlined />}
              suffix="个"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 平台分布和活跃度 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="平台分布"
            extra={
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={fetchStats}
                loading={loading}
              />
            }
          >
            <Table
              columns={columns}
              dataSource={platformData}
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="活跃账号"
            extra={
              <Space>
                <Select
                  defaultValue="30"
                  style={{ width: 100 }}
                  onChange={setTimeRange}
                >
                  <Option value="7">近7天</Option>
                  <Option value="30">近30天</Option>
                  <Option value="90">近90天</Option>
                </Select>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={fetchActivity}
                  loading={loading}
                />
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Statistic
                  title="活跃账号"
                  value={activity?.activeAccounts || 0}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="非活跃账号"
                  value={activity?.inactiveAccounts || 0}
                  prefix={<FallOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Space>
            </div>
            
            <Table
              columns={activeColumns}
              dataSource={activity?.recentActivity || []}
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 账号活跃度时间线 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近活跃账号">
            <List
              dataSource={activity?.recentActivity || []}
              loading={loading}
              renderItem={(item: Account) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={getPlatformIcon(item.platform)}
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      />
                    }
                    title={
                      <Space>
                        <span>{item.name}</span>
                        <Tag color="blue">{item.platform}</Tag>
                        <Tag color={item.status === 'active' ? 'success' : 'default'}>
                          {item.status === 'active' ? '活跃' : '非活跃'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <span>内容数: {item.content_count}</span>
                        <span>•</span>
                        <span>创建于: {new Date(item.created_at).toLocaleDateString()}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="需要关注的账号">
            <List
              dataSource={activity?.inactiveList || []}
              loading={loading}
              renderItem={(item: Account) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={getPlatformIcon(item.platform)}
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      />
                    }
                    title={
                      <Space>
                        <span>{item.name}</span>
                        <Tag color="blue">{item.platform}</Tag>
                        <Tag color="warning">需要关注</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <span>内容数: {item.content_count}</span>
                        <span>•</span>
                        <span>状态: {item.status}</span>
                        <span>•</span>
                        <span>创建于: {new Date(item.created_at).toLocaleDateString()}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountStats;