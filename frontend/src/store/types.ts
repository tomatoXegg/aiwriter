export interface AppState {
  app: {
    loading: boolean;
    error: string | null;
    theme: 'light' | 'dark';
  };
}

export interface AccountState {
  accounts: any[];
  currentAccount: any | null;
  loading: boolean;
  error: string | null;
}

export interface MaterialState {
  materials: any[];
  currentMaterial: any | null;
  loading: boolean;
  error: string | null;
  filters: {
    platform?: string;
    status?: string;
    tags?: string[];
  };
}

export interface ContentState {
  contents: any[];
  currentContent: any | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    platform?: string;
    dateRange?: [string, string];
  };
}

export interface TopicState {
  topics: any[];
  currentTopic: any | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: string;
  };
}

export interface RootState {
  app: AppState['app'];
  account: AccountState;
  material: MaterialState;
  content: ContentState;
  topic: TopicState;
}