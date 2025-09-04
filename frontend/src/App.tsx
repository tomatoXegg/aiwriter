import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<div>账号管理</div>} />
            <Route path="/materials" element={<div>素材管理</div>} />
            <Route path="/workflow/topics" element={<div>选题整合</div>} />
            <Route path="/workflow/content" element={<div>内容生成</div>} />
            <Route path="/workflow/review" element={<div>内容审查</div>} />
            <Route path="/content-list" element={<div>内容管理</div>} />
            <Route path="/settings" element={<div>设置</div>} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
