import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { useAccountStore } from '../../store';
import type { Account, CreateAccountDto, UpdateAccountDto } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

interface AccountFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  account?: Account;
}

const AccountForm: React.FC<AccountFormProps> = ({ visible, onCancel, onSuccess, account }) => {
  const [form] = Form.useForm();
  const { createAccount, updateAccount, loading } = useAccountStore();

  useEffect(() => {
    if (visible && account) {
      form.setFieldsValue({
        name: account.name,
        description: account.description,
        platform: account.platform,
        status: account.status,
      });
    } else {
      form.resetFields();
    }
  }, [visible, account, form]);

  const handleSubmit = async (values: CreateAccountDto | UpdateAccountDto) => {
    try {
      if (account) {
        await updateAccount(account.id, values as UpdateAccountDto);
      } else {
        await createAccount(values as CreateAccountDto);
      }
      onSuccess();
      form.resetFields();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  return (
    <Modal
      title={account ? '编辑账号' : '新增账号'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          platform: 'wechat',
          status: 'active',
        }}
      >
        <Form.Item
          name="name"
          label="账号名称"
          rules={[
            { required: true, message: '请输入账号名称' },
            { min: 2, max: 50, message: '账号名称长度为2-50个字符' },
          ]}
        >
          <Input placeholder="请输入账号名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="账号描述"
          rules={[
            { max: 200, message: '账号描述最多200个字符' },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="请输入账号描述（可选）"
          />
        </Form.Item>

        <Form.Item
          name="platform"
          label="平台类型"
          rules={[
            { required: true, message: '请选择平台类型' },
          ]}
        >
          <Select placeholder="请选择平台类型">
            <Option value="wechat">微信公众号</Option>
            <Option value="weibo">微博</Option>
            <Option value="zhihu">知乎</Option>
            <Option value="other">其他</Option>
          </Select>
        </Form.Item>

        {account && (
          <Form.Item
            name="status"
            label="账号状态"
            rules={[
              { required: true, message: '请选择账号状态' },
            ]}
          >
            <Select placeholder="请选择账号状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">停用</Option>
              <Option value="suspended">暂停</Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {account ? '更新' : '创建'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccountForm;