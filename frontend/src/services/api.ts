import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import type { 
  Account, Material, Topic, Content, Review, ApiResponse, PaginatedResponse,
  AccountStats, AccountsStats, AccountActivity, AccountTrends,
  CreateAccountDto, UpdateAccountDto, BulkStatusUpdateDto, AccountFilters
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        const { response } = error;
        
        if (response?.status === 401) {
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (response?.status === 403) {
          message.error('权限不足');
        } else if (response?.status === 404) {
          message.error('请求的资源不存在');
        } else if (response?.status === 500) {
          message.error('服务器内部错误');
        } else {
          message.error(error.message || '网络请求失败');
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // Account APIs
  async getAccounts(params?: AccountFilters): Promise<any> {
    return this.get<any>('/accounts', { params });
  }

  async getAccountById(id: string): Promise<ApiResponse<Account>> {
    return this.get<ApiResponse<Account>>(`/accounts/${id}`);
  }

  async createAccount(account: CreateAccountDto): Promise<ApiResponse<Account>> {
    return this.post<ApiResponse<Account>>('/accounts', account);
  }

  async updateAccount(id: string, updates: UpdateAccountDto): Promise<ApiResponse<Account>> {
    return this.put<ApiResponse<Account>>(`/accounts/${id}`, updates);
  }

  async deleteAccount(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/accounts/${id}`);
  }

  // Account Status Management
  async activateAccount(id: string): Promise<ApiResponse<Account>> {
    return this.post<ApiResponse<Account>>(`/accounts/${id}/activate`, {});
  }

  async deactivateAccount(id: string): Promise<ApiResponse<Account>> {
    return this.post<ApiResponse<Account>>(`/accounts/${id}/deactivate`, {});
  }

  async getAccountStatus(id: string): Promise<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`/accounts/${id}/status`);
  }

  async bulkUpdateStatus(data: BulkStatusUpdateDto): Promise<ApiResponse<any>> {
    return this.put<ApiResponse<any>>('/accounts/status/bulk', data);
  }

  // Account Statistics
  async getAccountStats(id: string): Promise<ApiResponse<AccountStats>> {
    return this.get<ApiResponse<AccountStats>>(`/accounts/${id}/stats`);
  }

  async getAllAccountsStats(): Promise<ApiResponse<AccountsStats>> {
    return this.get<ApiResponse<AccountsStats>>('/accounts/stats/overview');
  }

  async getAccountsActivity(): Promise<ApiResponse<AccountActivity>> {
    return this.get<ApiResponse<AccountActivity>>('/accounts/activity');
  }

  async getAccountsTrends(days?: number): Promise<ApiResponse<AccountTrends>> {
    return this.get<ApiResponse<AccountTrends>>('/accounts/trends', { 
      params: { days: days || 30 } 
    });
  }

  // Material APIs
  async getMaterials(params?: any): Promise<PaginatedResponse<Material>> {
    return this.get<PaginatedResponse<Material>>('/materials', { params });
  }

  async createMaterial(material: Omit<Material, 'id' | 'createdAt'>): Promise<ApiResponse<Material>> {
    return this.post<ApiResponse<Material>>('/materials', material);
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<ApiResponse<Material>> {
    return this.put<ApiResponse<Material>>(`/materials/${id}`, updates);
  }

  async deleteMaterial(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/materials/${id}`);
  }

  // Topic APIs
  async generateTopics(materialId: string, prompt?: string): Promise<ApiResponse<Topic[]>> {
    return this.post<ApiResponse<Topic[]>>('/topics/generate', { materialId, prompt });
  }

  async getTopics(params?: any): Promise<PaginatedResponse<Topic>> {
    return this.get<PaginatedResponse<Topic>>('/topics', { params });
  }

  async selectTopic(id: string): Promise<ApiResponse<Topic>> {
    return this.put<ApiResponse<Topic>>(`/topics/${id}/select`, {});
  }

  // Content APIs
  async generateContent(topicId: string, prompt?: string): Promise<ApiResponse<Content>> {
    return this.post<ApiResponse<Content>>('/content/generate', { topicId, prompt });
  }

  async getContents(params?: any): Promise<PaginatedResponse<Content>> {
    return this.get<PaginatedResponse<Content>>('/content', { params });
  }

  async getContent(id: string): Promise<ApiResponse<Content>> {
    return this.get<ApiResponse<Content>>(`/content/${id}`);
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<ApiResponse<Content>> {
    return this.put<ApiResponse<Content>>(`/content/${id}`, updates);
  }

  async deleteContent(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/content/${id}`);
  }

  // Review APIs
  async reviewContent(contentId: string): Promise<ApiResponse<Review>> {
    return this.post<ApiResponse<Review>>(`/content/${contentId}/review`, {});
  }

  async getReviews(params?: any): Promise<PaginatedResponse<Review>> {
    return this.get<PaginatedResponse<Review>>('/reviews', { params });
  }
}

export const apiClient = new ApiClient();