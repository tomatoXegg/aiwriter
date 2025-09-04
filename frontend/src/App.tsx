import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import router from './router';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

export default App;
