export interface Account {
  id: string;
  name: string;
  description?: string;
  platform: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  content_count: number;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  type: string;
  created_at: string;
  account_id?: string;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  material_id?: string;
  prompt?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Content {
  id: string;
  title: string;
  body: string;
  topic_id?: string;
  account_id?: string;
  status: 'draft' | 'published' | 'archived';
  prompt?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  content_id: string;
  quality?: number;
  originality?: number;
  suggestions?: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  type: 'topic' | 'content' | 'review';
  template: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateAccountRequest {
  name: string;
  description?: string;
  platform?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  description?: string;
  status?: string;
}

export interface CreateMaterialRequest {
  title: string;
  content: string;
  tags?: string[];
  type?: string;
  account_id?: string;
}

export interface CreateTopicRequest {
  title: string;
  description?: string;
  material_id?: string;
  prompt?: string;
}

export interface CreateContentRequest {
  title: string;
  body: string;
  topic_id?: string;
  account_id?: string;
  prompt?: string;
}

export interface CreateReviewRequest {
  content_id?: string;
  quality?: number;
  originality?: number;
  suggestions?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerateTopicsRequest {
  material: string;
  customPrompt?: string;
}

export interface GenerateContentRequest {
  topic: {
    title: string;
    description?: string;
  };
  options?: {
    wordCount?: number;
    style?: string;
    customPrompt?: string;
  };
}

export interface ReviewContentRequest {
  content: string;
}