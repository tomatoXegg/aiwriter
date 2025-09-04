import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, List, Typography, Space } from 'antd';
import { FileTextOutlined, UserOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { 
    accounts, 
    materials, 
    contents, 
    currentAccount,
    setAccounts,
    setMaterials,
    setContents,
    setLoading,
    setError 
  } = useAppStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [accountsData, materialsData, contentsData] = await Promise.all([
        apiService.getAccounts(),
        apiService.getMaterials(),
        apiService.getContents()
      ]);

      setAccounts(accountsData);
      setMaterials(materialsData);
      setContents(contentsData);
      
      // Set first account as current if none selected
      if (!currentAccount && accountsData.length > 0) {
        // setCurrentAccount would be called here
      }
    } catch (error) {
      setError('加载仪表板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const activeAccounts = accounts.filter(account => account.status === 'active');
  const publishedContents = contents.filter(content => content.status === 'published');
  const recentContents = contents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <Title level={2}>仪表板</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃账号"
              value={activeAccounts.length}
              prefix={<UserOutlined />}
              suffix={`/ ${accounts.length}`}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="素材数量"
              value={materials.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已发布内容"
              value={publishedContents.length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总内容数"
              value={contents.length}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="快速操作" style={{ height: '100%' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button type="primary" block size="large">
                创建新内容
              </Button>
              <Button block size="large">
                管理账号
              </Button>
              <Button block size="large">
                素材管理
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="最近内容" style={{ height: '100%' }}>
            <List
              dataSource={recentContents}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.title}</Text>}
                    description={
                      <Space>
                        <Text type="secondary">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        <Text type="secondary">·</Text>
                        <Text 
                          type={
                            item.status === 'published' ? 'success' : 
                            item.status === 'reviewed' ? 'warning' : undefined
                          }
                        >
                          {item.status === 'published' ? '已发布' : 
                           item.status === 'reviewed' ? '已审查' : '草稿'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无内容' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;