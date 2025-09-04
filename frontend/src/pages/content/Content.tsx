import React from 'react';
import { Card, Table, Button, Space, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const Content: React.FC = () => {
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} size="small">
            编辑
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const data = [];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>内容管理</h1>
      <Card
        title="内容列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            新增内容
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索内容"
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            total: 0,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default Content;