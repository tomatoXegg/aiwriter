import React from 'react';
import { Card, Table, Button, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const Accounts: React.FC = () => {
  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '账号名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
      <h1 style={{ marginBottom: 24 }}>账号管理</h1>
      <Card
        title="账号列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            新增账号
          </Button>
        }
      >
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

export default Accounts;