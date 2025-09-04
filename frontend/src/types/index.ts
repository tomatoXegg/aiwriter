export interface Account {
  id: string;
  name: string;
  description: string;
  platform: 'wechat';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  contentCount: number;
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