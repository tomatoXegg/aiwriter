export interface Account {
  id: string;
  name: string;
  description?: string;
  platform: 'wechat' | 'weibo' | 'zhihu' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  content_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: 'text' | 'file';
  createdAt: Date;
  accountId: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  materialId: string;
  prompt: string;
  status: 'pending' | 'selected' | 'discarded';
  createdAt: Date;
}

export interface Content {
  id: string;
  title: string;
  body: string;
  topicId: string;
  accountId: string;
  status: 'draft' | 'generated' | 'reviewed' | 'published';
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  contentId: string;
  quality: number;
  originality: number;
  suggestions: string[];
  status: 'pending' | 'passed' | 'failed';
  reviewedAt: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  type: 'topic' | 'content' | 'review';
  template: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export interface AccountStats {
  accountId: string;
  accountName: string;
  totalContent: number;
  platform: string;
  status: string;
  createdAt: string;
}

export interface AccountsStats {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  suspendedAccounts: number;
  totalContent: number;
  platformDistribution: Record<string, number>;
}

export interface AccountActivity {
  activeAccounts: number;
  inactiveAccounts: number;
  recentActivity: Account[];
  inactiveList: Account[];
}

export interface AccountTrends {
  trends: AccountTrend[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface AccountTrend {
  date: string;
  count: number;
  active_count: number;
  wechat_count: number;
  weibo_count: number;
  zhihu_count: number;
}

export interface CreateAccountDto {
  name: string;
  description?: string;
  platform?: 'wechat' | 'weibo' | 'zhihu' | 'other';
}

export interface UpdateAccountDto {
  name?: string;
  description?: string;
  platform?: 'wechat' | 'weibo' | 'zhihu' | 'other';
  status?: 'active' | 'inactive' | 'suspended';
}

export interface BulkStatusUpdateDto {
  accountIds: string[];
  status: 'active' | 'inactive' | 'suspended';
}

export interface AccountFilters {
  status?: string;
  platform?: string;
  search?: string;
  page?: number;
  limit?: number;
}