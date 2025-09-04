import type { Account, Material, Topic, Content, Review } from '../types';

const API_BASE_URL = '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Account APIs
  async getAccounts(): Promise<Account[]> {
    return this.request<Account[]>('/accounts');
  }

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'contentCount'>): Promise<Account> {
    return this.request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Material APIs
  async getMaterials(): Promise<Material[]> {
    return this.request<Material[]>('/materials');
  }

  async createMaterial(material: Omit<Material, 'id' | 'createdAt'>): Promise<Material> {
    return this.request<Material>('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    return this.request<Material>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMaterial(id: string): Promise<void> {
    return this.request<void>(`/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Topic APIs
  async generateTopics(materialId: string, prompt?: string): Promise<Topic[]> {
    return this.request<Topic[]>('/topics/generate', {
      method: 'POST',
      body: JSON.stringify({ materialId, prompt }),
    });
  }

  async getTopics(): Promise<Topic[]> {
    return this.request<Topic[]>('/topics');
  }

  async selectTopic(id: string): Promise<Topic> {
    return this.request<Topic>(`/topics/${id}/select`, {
      method: 'PUT',
    });
  }

  // Content APIs
  async generateContent(topicId: string, prompt?: string): Promise<Content> {
    return this.request<Content>('/content/generate', {
      method: 'POST',
      body: JSON.stringify({ topicId, prompt }),
    });
  }

  async getContents(): Promise<Content[]> {
    return this.request<Content[]>('/content');
  }

  async getContent(id: string): Promise<Content> {
    return this.request<Content>(`/content/${id}`);
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<Content> {
    return this.request<Content>(`/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteContent(id: string): Promise<void> {
    return this.request<void>(`/content/${id}`, {
      method: 'DELETE',
    });
  }

  // Review APIs
  async reviewContent(contentId: string): Promise<Review> {
    return this.request<Review>(`/content/${contentId}/review`, {
      method: 'POST',
    });
  }

  async getReviews(): Promise<Review[]> {
    return this.request<Review[]>('/reviews');
  }
}

export const apiService = new ApiService();