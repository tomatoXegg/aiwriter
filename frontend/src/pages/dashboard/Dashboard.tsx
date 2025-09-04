import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, FileTextOutlined, PictureOutlined, BulbOutlined } from '@ant-design/icons';

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>仪表板</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="账号总数"
              value={12}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="素材总数"
              value={156}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="内容总数"
              value={89}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="选题总数"
              value={45}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="最近活动" style={{ height: 300 }}>
            <div style={{ textAlign: 'center', color: '#999', marginTop: 100 }}>
              暂无活动记录
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统状态" style={{ height: 300 }}>
            <div style={{ textAlign: 'center', color: '#999', marginTop: 100 }}>
              系统运行正常
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;