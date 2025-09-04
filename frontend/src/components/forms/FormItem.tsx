import React from 'react';
import { Form, FormItemProps as AntFormItemProps } from 'antd';

interface FormItemProps extends AntFormItemProps {
  children: React.ReactNode;
}

export const FormItem: React.FC<FormItemProps> = ({ children, ...props }) => {
  return (
    <Form.Item {...props}>
      {children}
    </Form.Item>
  );
};