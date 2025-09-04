import { Topic, TopicEvaluation, TopicFilterOptions, TopicSortOptions } from '../database/models/types';
import { TopicModel } from '../database/models/Topic';
import Database from '../database/init';

export interface TopicRecommendation {
  topic: Topic;
  recommendationScore: number;
  reasons: string[];
  confidence: number;
}

export interface TopicSimilarityResult {
  topic1: Topic;
  topic2: Topic;
  similarity: number;
  commonKeywords: string[];
  differences: string[];
}

export interface TopicAnalytics {
  totalTopics: number;
  averageScore: number;
  topCategories: Array<{
    category: string;
    count: number;
    averageScore: number;
  }>;
  topTags: Array<{
    tag: string;
    count: number;
    averageScore: number;
  }>;
  qualityDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  trends: Array<{
    date: string;
    count: number;
    averageScore: number;
  }>;
}

export class TopicAnalysisService {
  private topicModel: TopicModel;

  constructor(database: Database) {
    this.topicModel = new TopicModel(database);
  }

  // 高级选题筛选
  async filterTopics(options: {
    filters: TopicFilterOptions;
    sort?: TopicSortOptions;
    page?: number;
    limit?: number;
  }): Promise<{
    topics: Topic[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    appliedFilters: TopicFilterOptions;
  }> {
    const { filters, sort, page = 1, limit = 10 } = options;
    
    // 构建查询条件
    let whereClause = '';
    const params: any[] = [];

    // 基础过滤条件
    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.category) {
      whereClause += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.material_id) {
      whereClause += ' AND material_id = ?';
      params.push(filters.material_id);
    }

    if (filters.template_id) {
      whereClause += ' AND template_id = ?';
      params.push(filters.template_id);
    }

    if (filters.min_score !== undefined) {
      whereClause += ' AND score >= ?';
      params.push(filters.min_score);
    }

    if (filters.max_score !== undefined) {
      whereClause += ' AND score <= ?';
      params.push(filters.max_score);
    }

    if (filters.difficulty_level) {
      whereClause += ' AND difficulty_level = ?';
      params.push(filters.difficulty_level);
    }

    if (filters.target_audience) {
      whereClause += ' AND target_audience = ?';
      params.push(filters.target_audience);
    }

    if (filters.search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR keywords LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 标签过滤（JSON搜索）
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => `JSON_EXTRACT(tags, '$[*]') LIKE ?`).join(' OR ');
      whereClause += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => {
        params.push(`%"${tag}"%`);
      });
    }

    // 关键词过滤（JSON搜索）
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordConditions = filters.keywords.map(keyword => `JSON_EXTRACT(keywords, '$[*]') LIKE ?`).join(' OR ');
      whereClause += ` AND (${keywordConditions})`;
      filters.keywords.forEach(keyword => {
        params.push(`%"${keyword}"%`);
      });
    }

    // 日期过滤
    if (filters.date_from) {
      whereClause += ' AND created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereClause += ' AND created_at <= ?';
      params.push(filters.date_to);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM topics WHERE 1=1 ${whereClause}`;
    const countResult = await this.topicModel['db'].get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // 排序
    let orderBy = 'created_at DESC';
    if (sort) {
      const validFields = ['created_at', 'updated_at', 'score', 'quality_score', 'creativity_score', 'feasibility_score', 'relevance_score', 'title'];
      if (validFields.includes(sort.field)) {
        orderBy = `${sort.field} ${sort.order}`;
      }
    }

    // 分页查询
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT * FROM topics 
      WHERE 1=1 ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const rows = await this.topicModel['db'].all(dataQuery, [...params, limit, offset]);
    const topics = rows.map((row: any) => this.topicModel['rowToTopic'](row));

    return {
      topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      appliedFilters: filters
    };
  }

  // 选题推荐
  async getRecommendedTopics(options: {
    limit?: number;
    minScore?: number;
    categories?: string[];
    excludeStatuses?: string[];
    materialId?: string;
  }): Promise<TopicRecommendation[]> {
    const { 
      limit = 10, 
      minScore = 7, 
      categories = [], 
      excludeStatuses = ['discarded'],
      materialId
    } = options;

    // 构建推荐查询
    let whereClause = 'score >= ?';
    const params: any[] = [minScore];

    if (excludeStatuses.length > 0) {
      const placeholders = excludeStatuses.map(() => '?').join(',');
      whereClause += ` AND status NOT IN (${placeholders})`;
      params.push(...excludeStatuses);
    }

    if (categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      whereClause += ` AND category IN (${placeholders})`;
      params.push(...categories);
    }

    if (materialId) {
      whereClause += ' AND material_id = ?';
      params.push(materialId);
    }

    const query = `
      SELECT * FROM topics 
      WHERE ${whereClause}
      ORDER BY score DESC, created_at DESC
      LIMIT ?
    `;
    const rows = await this.topicModel['db'].all(query, [...params, limit]);
    const topics = rows.map((row: any) => this.topicModel['rowToTopic'](row));

    // 生成推荐分数和理由
    const recommendations: TopicRecommendation[] = topics.map(topic => {
      const reasons: string[] = [];
      let recommendationScore = topic.score;

      if (topic.score >= 9) {
        reasons.push('选题评分极高');
        recommendationScore += 2;
      }

      if (topic.quality_score && topic.quality_score >= 8) {
        reasons.push('内容质量优秀');
        recommendationScore += 1.5;
      }

      if (topic.creativity_score && topic.creativity_score >= 8) {
        reasons.push('创意独特');
        recommendationScore += 1.5;
      }

      if (topic.feasibility_score && topic.feasibility_score >= 8) {
        reasons.push('可行性高');
        recommendationScore += 1;
      }

      if (topic.relevance_score && topic.relevance_score >= 8) {
        reasons.push('相关性高');
        recommendationScore += 1;
      }

      if (topic.tags && topic.tags.length > 3) {
        reasons.push('标签丰富');
        recommendationScore += 0.5;
      }

      // 根据时间衰减
      const daysSinceCreated = (Date.now() - new Date(topic.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) {
        reasons.push('最新创建');
        recommendationScore += 0.5;
      }

      return {
        topic,
        recommendationScore: Math.min(recommendationScore, 10),
        reasons,
        confidence: Math.min(0.7 + (topic.score / 10) * 0.3, 1)
      };
    });

    return recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  // 选题相似度检测
  async findSimilarTopics(topicId: string, options: {
    limit?: number;
    minSimilarity?: number;
  } = {}): Promise<TopicSimilarityResult[]> {
    const { limit = 10, minSimilarity = 0.3 } = options;

    const targetTopic = await this.topicModel.findById(topicId);
    if (!targetTopic) {
      throw new Error('Topic not found');
    }

    // 获取所有其他选题
    const allTopics = await this.topicModel.findAll({ limit: 1000 });
    const otherTopics = allTopics.data.filter(t => t.id !== topicId);

    const similarities: TopicSimilarityResult[] = [];

    for (const topic of otherTopics) {
      const similarity = this.calculateSimilarity(targetTopic, topic);
      
      if (similarity >= minSimilarity) {
        const commonKeywords = this.findCommonKeywords(targetTopic, topic);
        const differences = this.findDifferences(targetTopic, topic);

        similarities.push({
          topic1: targetTopic,
          topic2: topic,
          similarity,
          commonKeywords,
          differences
        });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // 选题分析报告
  async generateAnalytics(options: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  } = {}): Promise<TopicAnalytics> {
    const { dateFrom, dateTo, category } = options;

    let whereClause = '1=1';
    const params: any[] = [];

    if (dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(dateTo);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    // 基础统计
    const baseQuery = `SELECT * FROM topics WHERE ${whereClause}`;
    const rows = await this.topicModel['db'].all(baseQuery, params);
    const topics = rows.map((row: any) => this.topicModel['rowToTopic'](row));

    const totalTopics = topics.length;
    const averageScore = topics.length > 0 
      ? topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length 
      : 0;

    // 分类统计
    const categoryStats = new Map<string, { count: number; totalScore: number }>();
    const tagStats = new Map<string, { count: number; totalScore: number }>();

    for (const topic of topics) {
      // 分类统计
      if (topic.category) {
        const stat = categoryStats.get(topic.category) || { count: 0, totalScore: 0 };
        stat.count++;
        stat.totalScore += topic.score;
        categoryStats.set(topic.category, stat);
      }

      // 标签统计
      if (topic.tags) {
        for (const tag of topic.tags) {
          const stat = tagStats.get(tag) || { count: number; totalScore: number } as any;
          stat.count++;
          stat.totalScore += topic.score;
          tagStats.set(tag, stat);
        }
      }
    }

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stat]) => ({
        category,
        count: stat.count,
        averageScore: stat.totalScore / stat.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topTags = Array.from(tagStats.entries())
      .map(([tag, stat]) => ({
        tag,
        count: stat.count,
        averageScore: stat.totalScore / stat.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // 质量分布
    const qualityDistribution = {
      excellent: topics.filter(t => t.score >= 9).length,
      good: topics.filter(t => t.score >= 7 && t.score < 9).length,
      average: topics.filter(t => t.score >= 5 && t.score < 7).length,
      poor: topics.filter(t => t.score < 5).length
    };

    // 趋势分析（按日期）
    const dateStats = new Map<string, { count: number; totalScore: number }>();
    for (const topic of topics) {
      const date = topic.created_at.split('T')[0];
      const stat = dateStats.get(date) || { count: 0, totalScore: 0 };
      stat.count++;
      stat.totalScore += topic.score;
      dateStats.set(date, stat);
    }

    const trends = Array.from(dateStats.entries())
      .map(([date, stat]) => ({
        date,
        count: stat.count,
        averageScore: stat.totalScore / stat.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 最近30天

    return {
      totalTopics,
      averageScore,
      topCategories,
      topTags,
      qualityDistribution,
      trends
    };
  }

  // 选题智能评分
  async intelligentScore(topic: Topic): Promise<{
    quality_score: number;
    creativity_score: number;
    feasibility_score: number;
    relevance_score: number;
    overall_score: number;
    feedback: string;
    suggestions: string[];
  }> {
    const scores = {
      quality_score: 0,
      creativity_score: 0,
      feasibility_score: 0,
      relevance_score: 0,
      overall_score: 0,
      feedback: '',
      suggestions: [] as string[]
    };

    // 质量评分
    if (topic.description && topic.description.length > 50) {
      scores.quality_score += 3;
    } else {
      scores.suggestions.push('建议增加更详细的描述');
    }

    if (topic.keywords && topic.keywords.length >= 3) {
      scores.quality_score += 2;
    } else {
      scores.suggestions.push('建议添加更多关键词');
    }

    if (category) {
      scores.quality_score += 2;
    }

    // 创意评分
    if (topic.title && topic.title.length > 10 && topic.title.length < 50) {
      scores.creativity_score += 3;
    }

    if (topic.tags && topic.tags.some(tag => this.isCreativeTag(tag))) {
      scores.creativity_score += 2;
    }

    // 可行性评分
    if (topic.difficulty_level === 'beginner' || topic.difficulty_level === 'intermediate') {
      scores.feasibility_score += 3;
    } else if (topic.difficulty_level === 'advanced') {
      scores.feasibility_score += 1;
      scores.suggestions.push('高级难度选题需要更多资源投入');
    }

    if (topic.estimated_read_time && topic.estimated_read_time <= 10) {
      scores.feasibility_score += 2;
    }

    // 相关性评分
    if (topic.target_audience) {
      scores.relevance_score += 3;
    }

    if (topic.material_id) {
      scores.relevance_score += 2;
    }

    // 计算总分
    scores.overall_score = Math.round(
      (scores.quality_score + scores.creativity_score + scores.feasibility_score + scores.relevance_score) / 4
    );

    // 生成反馈
    if (scores.overall_score >= 8) {
      scores.feedback = '选题质量优秀，建议优先考虑';
    } else if (scores.overall_score >= 6) {
      scores.feedback = '选题质量良好，可以进一步优化';
    } else {
      scores.feedback = '选题需要改进，建议参考优化建议';
    }

    return scores;
  }

  // 辅助方法：计算相似度
  private calculateSimilarity(topic1: Topic, topic2: Topic): number {
    let similarity = 0;

    // 标题相似度
    if (topic1.title && topic2.title) {
      const titleSimilarity = this.stringSimilarity(topic1.title, topic2.title);
      similarity += titleSimilarity * 0.3;
    }

    // 描述相似度
    if (topic1.description && topic2.description) {
      const descSimilarity = this.stringSimilarity(topic1.description, topic2.description);
      similarity += descSimilarity * 0.3;
    }

    // 关键词相似度
    if (topic1.keywords && topic2.keywords) {
      const keywordSimilarity = this.arraySimilarity(topic1.keywords, topic2.keywords);
      similarity += keywordSimilarity * 0.3;
    }

    // 分类相似度
    if (topic1.category && topic2.category && topic1.category === topic2.category) {
      similarity += 0.1;
    }

    return Math.min(similarity, 1);
  }

  // 辅助方法：字符串相似度
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // 辅助方法：数组相似度
  private arraySimilarity(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    
    const intersection = arr1.filter(item => arr2.includes(item));
    const union = [...new Set([...arr1, ...arr2])];
    
    return intersection.length / union.length;
  }

  // 辅助方法：编辑距离
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // 辅助方法：查找共同关键词
  private findCommonKeywords(topic1: Topic, topic2: Topic): string[] {
    if (!topic1.keywords || !topic2.keywords) return [];
    return topic1.keywords.filter(keyword => topic2.keywords?.includes(keyword));
  }

  // 辅助方法：查找差异
  private findDifferences(topic1: Topic, topic2: Topic): string[] {
    const differences: string[] = [];
    
    if (topic1.category !== topic2.category) {
      differences.push(`分类不同: ${topic1.category} vs ${topic2.category}`);
    }
    
    if (topic1.difficulty_level !== topic2.difficulty_level) {
      differences.push(`难度级别不同: ${topic1.difficulty_level} vs ${topic2.difficulty_level}`);
    }
    
    if (topic1.target_audience !== topic2.target_audience) {
      differences.push(`目标读者不同: ${topic1.target_audience} vs ${topic2.target_audience}`);
    }
    
    return differences;
  }

  // 辅助方法：判断是否为创意标签
  private isCreativeTag(tag: string): boolean {
    const creativeKeywords = ['创新', '创意', '独特', '新颖', '前沿', '趋势', '未来', '突破'];
    return creativeKeywords.some(keyword => tag.includes(keyword));
  }
}