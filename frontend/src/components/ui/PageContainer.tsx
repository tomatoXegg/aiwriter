import React from 'react';
import { Card, CardProps } from 'antd';

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  extra?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  children,
  loading = false,
  extra,
}) => {
  return (
    <Card
      title={title}
      loading={loading}
      extra={extra}
      style={{ marginBottom: 16 }}
    >
      {children}
    </Card>
  );
};