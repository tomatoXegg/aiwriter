import { ConfigProvider, theme } from 'antd';
import { useAppStore } from '../store';

interface AppThemeProps {
  children: React.ReactNode;
}

export const AppTheme: React.FC<AppThemeProps> = ({ children }) => {
  const { app } = useAppStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: app.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 40,
          },
          Card: {
            borderRadius: 8,
          },
          Table: {
            borderRadius: 6,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};