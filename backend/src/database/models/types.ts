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
  category_id?: string;
  file_size?: number;
  word_count?: number;
  updated_at?: string;
}

export interface Category extends BaseModel {
  name: string;
  description: string;
  color: string;
}

export interface Tag extends BaseModel {
  name: string;
  color: string;
  usage_count: number;
}

export interface Topic extends BaseModel {
  title: string;
  description?: string;
  material_id?: string;
  prompt?: string;
  status: 'pending' | 'selected' | 'discarded' | 'in_progress' | 'completed';
  score: number;
  category?: string;
  tags?: string[];
  keywords?: string[];
  target_audience?: string;
  estimated_read_time?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  quality_score?: number;
  creativity_score?: number;
  feasibility_score?: number;
  relevance_score?: number;
  ai_response?: string;
  generation_id?: string;
  template_id?: string;
  selected_at?: string;
  discarded_at?: string;
  updated_at?: string;
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
  description?: string;
  type: 'topic' | 'content' | 'review';
  template: string;
  category?: string;
  variables?: string[];
  is_default: boolean;
  is_public?: boolean;
  usage_count?: number;
  created_by?: string;
  updated_at?: string;
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
  category_id?: string;
  file_size?: number;
  word_count?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
  material_id?: string;
  prompt?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  target_audience?: string;
  estimated_read_time?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
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
  description?: string;
  type: 'topic' | 'content' | 'review';
  template: string;
  category?: string;
  variables?: string[];
  is_default?: boolean;
  is_public?: boolean;
  created_by?: string;
}

// 选题生成相关接口
export interface TopicGeneration extends BaseModel {
  material_id: string;
  template_id?: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Topic[];
  error?: string;
  estimated_time?: number;
  progress?: number;
  completed_at?: string;
  created_by?: string;
}

export interface CreateTopicGenerationDto {
  material_id: string;
  template_id?: string;
  prompt?: string;
  count?: number;
  category?: string;
  style?: string;
  target_audience?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface TopicEvaluation {
  id: string;
  topic_id: string;
  quality_score: number;
  creativity_score: number;
  feasibility_score: number;
  relevance_score: number;
  overall_score: number;
  feedback?: string;
  suggestions?: string[];
  evaluated_at: string;
  evaluated_by?: string;
}

export interface CreateTopicEvaluationDto {
  topic_id: string;
  quality_score?: number;
  creativity_score?: number;
  feasibility_score?: number;
  relevance_score?: number;
  feedback?: string;
  suggestions?: string[];
}

// 选题筛选和查询接口
export interface TopicFilterOptions {
  status?: string;
  category?: string;
  material_id?: string;
  template_id?: string;
  min_score?: number;
  max_score?: number;
  difficulty_level?: string;
  target_audience?: string;
  tags?: string[];
  keywords?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface TopicSortOptions {
  field: 'created_at' | 'updated_at' | 'score' | 'quality_score' | 'creativity_score' | 'feability_score' | 'relevance_score';
  order: 'ASC' | 'DESC';
}

export interface TopicQueryOptions extends PaginationOptions {
  filters?: TopicFilterOptions;
  sort?: TopicSortOptions;
}

// 内容生成相关接口
export interface ContentStyle {
  tone: 'formal' | 'casual' | 'professional' | 'creative';
  length: 'short' | 'medium' | 'long';
  format: 'article' | 'blog' | 'report' | 'story';
}

export interface ContentMetadata {
  wordCount: number;
  readTime: number;
  language: string;
  tags: string[];
  category: string;
}

export interface ContentGeneration {
  id: string;
  topicId: string;
  prompt: string;
  style?: ContentStyle;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Content;
  error?: string;
  progress: number;
  estimatedTime: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface BatchGeneration {
  id: string;
  name: string;
  topics: string[];
  prompt: string;
  style?: ContentStyle;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: ContentGeneration[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  title: string;
  body: string;
  changeLog: string;
  createdAt: Date;
  createdBy: string;
}

export interface ContentOptimization {
  id: string;
  contentId: string;
  type: 'readability' | 'grammar' | 'style' | 'structure';
  score: number;
  issues: string[];
  improvements: string[];
  suggestions: string[];
  createdAt: Date;
}

// 扩展Content接口
export interface ContentWithStyle extends Content {
  style?: ContentStyle;
  metadata?: ContentMetadata;
  publishedAt?: Date;
}

// 内容生成请求接口
export interface GenerateContentRequest {
  topicId: string;
  prompt?: string;
  style?: ContentStyle;
  accountId?: string;
}

export interface GenerateCustomContentRequest {
  title: string;
  prompt: string;
  style?: ContentStyle;
  accountId?: string;
}

export interface GenerateBatchContentRequest {
  name: string;
  topicIds: string[];
  prompt?: string;
  style?: ContentStyle;
  accountId?: string;
}

export interface CreateContentVersionRequest {
  title: string;
  body: string;
  changeLog: string;
}

export interface ContentOptimizationRequest {
  type: 'readability' | 'grammar' | 'style' | 'structure';
  content: string;
}

// 内容生成响应接口
export interface GenerateContentResponse {
  generationId: string;
  status: 'pending' | 'processing';
  estimatedTime: number;
}

export interface ContentGenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ContentWithStyle;
  error?: string;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface BatchGenerationResult {
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  taskCount: number;
  completedTasks: number;
  results: ContentGenerationResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ContentOptimizationResult {
  contentId: string;
  suggestions: {
    readability: {
      score: number;
      issues: string[];
      improvements: string[];
    };
    grammar: {
      score: number;
      issues: string[];
      corrections: string[];
    };
    style: {
      score: number;
      suggestions: string[];
    };
    structure: {
      score: number;
      recommendations: string[];
    };
  };
}

// 内容筛选和查询接口
export interface ContentFilterOptions {
  status?: string;
  accountId?: string;
  topicId?: string;
  style?: ContentStyle;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
  category?: string;
  wordCountMin?: number;
  wordCountMax?: number;
}

export interface ContentSortOptions {
  field: 'created_at' | 'updated_at' | 'published_at' | 'word_count' | 'title';
  order: 'ASC' | 'DESC';
}

export interface ContentQueryOptions extends PaginationOptions {
  filters?: ContentFilterOptions;
  sort?: ContentSortOptions;
}