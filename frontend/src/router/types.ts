export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  title: string;
  icon?: React.ReactNode;
  requiresAuth?: boolean;
  children?: RouteConfig[];
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

export interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
}