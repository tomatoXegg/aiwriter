import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Accounts from './pages/accounts/Accounts';
import Materials from './pages/materials/Materials';
import Content from './pages/content/Content';
import Topics from './pages/topics/Topics';
import './styles/globals.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/accounts",
    element: (
      <ProtectedRoute>
        <Layout>
          <Accounts />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/materials",
    element: (
      <ProtectedRoute>
        <Layout>
          <Materials />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/content",
    element: (
      <ProtectedRoute>
        <Layout>
          <Content />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/topics",
    element: (
      <ProtectedRoute>
        <Layout>
          <Topics />
        </Layout>
      </ProtectedRoute>
    ),
  },
]);

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
