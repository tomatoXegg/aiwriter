import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Row,
  Col,
  Modal,
  message,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAccountStore } from '../../store';
import AccountForm from '../forms/AccountForm';
import type { Account } from '../../types';

const { Search } = Input;
const { Option } = Select;

const AccountList: React.FC = () => {
  const {
    accounts,
    loading,
    error,
    filters,
    fetchAccounts,
    deleteAccount,
    activateAccount,
    deactivateAccount,
    setFilters,
    clearError,
  } = useAccountStore();

  const [accountFormVisible, setAccountFormVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchAccounts(filters);
  }, [filters]);

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status });
  };

  const handlePlatformFilter = (platform: string) => {
    setFilters({ ...filters, platform: platform === 'all' ? undefined : platform });
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setAccountFormVisible(true);
  };

  const handleDelete = async (account: Account) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除账号 "${account.name}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteAccount(account.id);
      },
    });
  };

  const handleStatusChange = async (accountId: string, action: 'activate' | 'deactivate') => {
    try {
      if (action === 'activate') {
        await activateAccount(accountId);
        message.success('账号已激活');
      } else {
        await deactivateAccount(accountId);
        message.success('账号已停用');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      active: { color: 'success', icon: <CheckCircleOutlined />, text: '活跃' },
      inactive: { color: 'default', icon: <CloseCircleOutlined />, text: '停用' },
      suspended: { color: 'warning', icon: <PauseCircleOutlined />, text: '暂停' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getPlatformTag = (platform: string) => {
    const platformConfig = {
      wechat: { color: 'green', text: '微信公众号' },
      weibo: { color: 'red', text: '微博' },
      zhihu: { color: 'blue', text: '知乎' },
      other: { color: 'default', text: '其他' },
    };
    
    const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.other;
    
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleBatchAction = async (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的账号');
      return;
    }

    try {
      if (action === 'activate') {
        await Promise.all(selectedRowKeys.map(id => activateAccount(id)));
        message.success(`已激活 ${selectedRowKeys.length} 个账号`);
      } else if (action === 'deactivate') {
        await Promise.all(selectedRowKeys.map(id => deactivateAccount(id)));
        message.success(`已停用 ${selectedRowKeys.length} 个账号`);
      }
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('批量操作失败:', error);
    }
  };

  const columns = [
    {
      title: '账号名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Account) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => getPlatformTag(platform),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: Account) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // TODO: 实现查看详情功能
              }}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Dropdown
            overlay={
              <Menu
                onClick={({ key }) => {
                  if (key === 'delete') {
                    handleDelete(record);
                  } else if (key === 'activate') {
                    handleStatusChange(record.id, 'activate');
                  } else if (key === 'deactivate') {
                    handleStatusChange(record.id, 'deactivate');
                  }
                }}
              >
                <Menu.Item key="activate" disabled={record.status === 'active'}>
                  激活账号
                </Menu.Item>
                <Menu.Item key="deactivate" disabled={record.status === 'inactive'}>
                  停用账号
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="delete" danger>
                  删除账号
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: string[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      {/* 搜索和筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索账号名称或描述"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="筛选状态"
              style={{ width: '100%' }}
              value={filters.status || 'all'}
              onChange={handleStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">活跃</Option>
              <Option value="inactive">停用</Option>
              <Option value="suspended">暂停</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="筛选平台"
              style={{ width: '100%' }}
              value={filters.platform || 'all'}
              onChange={handlePlatformFilter}
            >
              <Option value="all">全部平台</Option>
              <Option value="wechat">微信公众号</Option>
              <Option value="weibo">微博</Option>
              <Option value="zhihu">知乎</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAccountFormVisible(true)}
              style={{ width: '100%' }}
            >
              新增账号
            </Button>
          </Col>
        </Row>
        
        {selectedRowKeys.length > 0 && (
          <Row style={{ marginTop: 16 }}>
            <Col>
              <Space>
                <span>已选择 {selectedRowKeys.length} 个账号</span>
                <Button
                  size="small"
                  onClick={() => handleBatchAction('activate')}
                >
                  批量激活
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchAction('deactivate')}
                >
                  批量停用
                </Button>
                <Button size="small" onClick={() => setSelectedRowKeys([])}>
                  取消选择
                </Button>
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      {/* 账号列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          rowSelection={rowSelection}
          loading={loading}
          pagination={{
            total: accounts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 账号表单弹窗 */}
      <AccountForm
        visible={accountFormVisible}
        onCancel={() => {
          setAccountFormVisible(false);
          setEditingAccount(null);
        }}
        onSuccess={() => {
          setAccountFormVisible(false);
          setEditingAccount(null);
          fetchAccounts(filters);
        }}
        account={editingAccount}
      />
    </div>
  );
};

export default AccountList;