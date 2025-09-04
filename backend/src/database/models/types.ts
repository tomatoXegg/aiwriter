export interface BaseModel {
  id: string;
  created_at: string;
}

export interface Timestamps {
  created_at: string;
  updated_at?: string;
}

export interface Account extends BaseModel {
  name: string;
  description?: string;
  platform: 'wechat' | 'weibo' | 'zhihu' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  content_count: number;
}

export interface Material extends BaseModel {
  title: string;
  content: string;
  tags: string[];
  type: 'text' | 'file' | 'link' | 'image';
  file_path?: string;
  account_id?: string;
}

export interface Topic extends BaseModel {
  title: string;
  description?: string;
  material_id?: string;
  prompt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  score: number;
}

export interface Content extends BaseModel, Timestamps {
  title: string;
  body: string;
  topic_id?: string;
  account_id?: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  prompt?: string;
  word_count: number;
}

export interface Review extends BaseModel {
  content_id: string;
  quality_score: number;
  originality_score: number;
  suggestions: ReviewSuggestion[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  reviewed_at: string;
}

export interface ReviewSuggestion {
  type: 'grammar' | 'structure' | 'content' | 'style' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface Configuration extends BaseModel, Timestamps {
  key: string;
  value: any;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'json';
  description?: string;
}

export interface PromptTemplate extends BaseModel {
  name: string;
  type: 'topic' | 'content' | 'review';
  template: string;
  is_default: boolean;
}

export interface SchemaMigration extends BaseModel {
  version: string;
  applied_at: string;
  description?: string;
}

// Query interfaces
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface FilterOptions {
  status?: string;
  type?: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Database operation interfaces
export interface DatabaseOperation {
  query: string;
  params: any[];
}

export interface TransactionResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Form interfaces
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

export interface CreateMaterialDto {
  title: string;
  content: string;
  tags?: string[];
  type?: 'text' | 'file' | 'link' | 'image';
  file_path?: string;
  account_id?: string;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
  material_id?: string;
  prompt?: string;
}

export interface CreateContentDto {
  title: string;
  body: string;
  topic_id?: string;
  account_id?: string;
  prompt?: string;
}

export interface CreateReviewDto {
  content_id: string;
  quality_score: number;
  originality_score: number;
  suggestions?: ReviewSuggestion[];
}

export interface CreateConfigurationDto {
  key: string;
  value: any;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'json';
  description?: string;
}

export interface CreatePromptTemplateDto {
  name: string;
  type: 'topic' | 'content' | 'review';
  template: string;
  is_default?: boolean;
}