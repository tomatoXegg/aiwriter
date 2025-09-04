import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { TopicModel } from '../database/models/Topic';
import { PromptTemplateModel } from '../database/models/PromptTemplate';
import { MaterialModel } from '../database/models/Material';
import EnhancedGeminiService, { TopicSuggestion } from '../services/enhancedGeminiService';
import { 
  Topic, 
  CreateTopicDto, 
  CreateTopicGenerationDto, 
  TopicGeneration, 
  CreateTopicEvaluationDto,
  TopicEvaluation,
  TopicFilterOptions,
  TopicSortOptions,
  QueryResult,
  CreatePromptTemplateDto
} from '../database/models/types';
import { v4 as uuidv4 } from 'uuid';
import Database from '../database/init';

export class TopicController {
  private topicModel: TopicModel;
  private templateModel: PromptTemplateModel;
  private materialModel: MaterialModel;
  private geminiService: EnhancedGeminiService;
  private db: Database;

  constructor(database: Database) {
    this.db = database;
    this.topicModel = new TopicModel(database);
    this.templateModel = new PromptTemplateModel(database);
    this.materialModel = new MaterialModel(database);
    this.geminiService = new EnhancedGeminiService();
  }

  // 生成选题
  async generateTopics(req: Request, res: Response) {
    try {
      const { 
        materialId, 
        templateId, 
        customPrompt, 
        count = 5, 
        category,
        style = '专业科普',
        targetAudience,
        difficultyLevel
      } = req.body;

      if (!materialId) {
        throw new AppError('素材ID不能为空', 400);
      }

      // 获取素材内容
      const material = await this.materialModel.findById(materialId);
      if (!material) {
        throw new AppError('素材不存在', 404);
      }

      // 构建prompt
      let prompt = customPrompt;
      if (!prompt && templateId) {
        const template = await this.templateModel.findById(templateId);
        if (!template) {
          throw new AppError('模板不存在', 404);
        }
        prompt = await this.templateModel.renderTemplate(templateId, {
          material: material.content,
          count,
          style,
          category: category || '通用',
          targetAudience: targetAudience || '公众号读者',
          difficultyLevel: difficultyLevel || 'intermediate'
        });
      }

      if (!prompt) {
        prompt = `基于以下素材，为我生成${count}个适合公众号文章的选题建议。

素材内容：
${material.content}

写作风格：${style}
目标读者：${targetAudience || '公众号读者'}
难度级别：${difficultyLevel || 'intermediate'}
分类：${category || '通用'}

要求：
1. 选题要具有时效性和实用性
2. 符合公众号读者阅读习惯
3. 避免敏感话题
4. 突出实用价值
5. 标题要吸引人，但避免标题党

请以JSON格式返回，包含topics数组，每个topic有：
- id: 唯一标识符
- title: 吸引人的标题
- description: 简要描述（100字以内）
- audience: 目标读者群体
- value: 预计传播价值
- keywords: 相关关键词数组
- score: 选题评分（1-10分）

返回格式：
{
  "topics": [...]
}`;
      }

      // 生成选题
      const suggestions = await this.geminiService.generateTopics(material.content, {
        count,
        style,
        model: 'gemini-pro'
      });

      // 转换为Topic格式并保存
      const topics: Topic[] = [];
      for (const suggestion of suggestions) {
        const topicData: CreateTopicDto = {
          title: suggestion.title,
          description: suggestion.description,
          material_id: materialId,
          prompt,
          category: category || '通用',
          tags: suggestion.keywords,
          keywords: suggestion.keywords,
          target_audience: suggestion.audience,
          difficulty_level: difficultyLevel as any,
          template_id: templateId
        };

        const topic = await this.topicModel.create(topicData);
        topics.push(topic);
      }

      res.json({
        success: true,
        data: {
          topics,
          total: topics.length,
          generationId: uuidv4(),
          estimatedTime: 10,
          materialId,
          templateId
        },
        message: '选题生成成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('生成选题失败', 500, error);
    }
  }

  // 批量生成选题
  async generateBatchTopics(req: Request, res: Response) {
    try {
      const { materialIds, templateId, customPrompt, options = {} } = req.body;

      if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
        throw new AppError('素材ID列表不能为空', 400);
      }

      if (materialIds.length > 10) {
        throw new AppError('一次最多处理10个素材', 400);
      }

      const results = [];
      for (const materialId of materialIds) {
        try {
          // 为每个素材生成选题
          const result = await this.generateTopicsForMaterial(materialId, {
            templateId,
            customPrompt,
            ...options
          });
          results.push({
            materialId,
            success: true,
            topics: result.topics,
            total: result.total
          });
        } catch (error) {
          results.push({
            materialId,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalTopics = results.reduce((sum, r) => sum + (r.success ? r.total : 0), 0);

      res.json({
        success: true,
        data: {
          results,
          summary: {
            totalMaterials: materialIds.length,
            successCount,
            failureCount: materialIds.length - successCount,
            totalTopics
          }
        },
        message: `批量生成完成，成功处理${successCount}/${materialIds.length}个素材`
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('批量生成选题失败', 500, error);
    }
  }

  // 自定义选题生成
  async generateCustomTopics(req: Request, res: Response) {
    try {
      const { prompt, materialId, count = 5, category, style } = req.body;

      if (!prompt) {
        throw new AppError('自定义prompt不能为空', 400);
      }

      let materialContent = '';
      if (materialId) {
        const material = await this.materialModel.findById(materialId);
        if (!material) {
          throw new AppError('素材不存在', 404);
        }
        materialContent = material.content;
      }

      // 构建完整的prompt
      const fullPrompt = `${prompt}

${materialContent ? `\n参考素材：\n${materialContent}` : ''}

要求：
1. 选题要具有时效性和实用性
2. 符合公众号读者阅读习惯
3. 避免敏感话题
4. 突出实用价值
5. 标题要吸引人，但避免标题党

请以JSON格式返回，包含topics数组，每个topic有：
- id: 唯一标识符
- title: 吸引人的标题
- description: 简要描述（100字以内）
- audience: 目标读者群体
- value: 预计传播价值
- keywords: 相关关键词数组
- score: 选题评分（1-10分）

返回格式：
{
  "topics": [...]
}`;

      // 生成选题
      const suggestions = await this.geminiService.generateTopics(materialContent || prompt, {
        count,
        style: style || '专业科普',
        model: 'gemini-pro'
      });

      // 转换为Topic格式并保存
      const topics: Topic[] = [];
      for (const suggestion of suggestions) {
        const topicData: CreateTopicDto = {
          title: suggestion.title,
          description: suggestion.description,
          material_id: materialId,
          prompt: fullPrompt,
          category: category || '自定义',
          tags: suggestion.keywords,
          keywords: suggestion.keywords,
          target_audience: suggestion.audience
        };

        const topic = await this.topicModel.create(topicData);
        topics.push(topic);
      }

      res.json({
        success: true,
        data: {
          topics,
          total: topics.length,
          generationId: uuidv4(),
          isCustom: true
        },
        message: '自定义选题生成成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('自定义选题生成失败', 500, error);
    }
  }

  // 获取选题列表
  async getTopics(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        material_id,
        category,
        min_score,
        max_score,
        difficulty_level,
        target_audience,
        tags,
        keywords,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options: any = {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        material_id: material_id as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      };

      // 应用过滤器
      const filters: TopicFilterOptions = {};
      if (category) filters.category = category as string;
      if (min_score) filters.min_score = Number(min_score);
      if (max_score) filters.max_score = Number(max_score);
      if (difficulty_level) filters.difficulty_level = difficulty_level as string;
      if (target_audience) filters.target_audience = target_audience as string;
      if (tags) filters.tags = (tags as string).split(',');
      if (keywords) filters.keywords = (keywords as string).split(',');

      const result = await this.topicModel.findAll(options);

      // 应用额外的过滤器（如果需要）
      let filteredData = result.data;
      if (Object.keys(filters).length > 0) {
        filteredData = result.data.filter(topic => {
          if (filters.category && topic.category !== filters.category) return false;
          if (filters.min_score && topic.score < filters.min_score) return false;
          if (filters.max_score && topic.score > filters.max_score) return false;
          if (filters.difficulty_level && topic.difficulty_level !== filters.difficulty_level) return false;
          if (filters.target_audience && topic.target_audience !== filters.target_audience) return false;
          if (filters.tags && !filters.tags.some(tag => topic.tags?.includes(tag))) return false;
          if (filters.keywords && !filters.keywords.some(keyword => topic.keywords?.includes(keyword))) return false;
          return true;
        });
      }

      res.json({
        success: true,
        data: {
          topics: filteredData,
          total: filteredData.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(filteredData.length / Number(limit)),
          filters
        },
        message: '获取选题列表成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取选题列表失败', 500, error);
    }
  }

  // 获取选题详情
  async getTopicById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const topic = await this.topicModel.findById(id);

      if (!topic) {
        throw new AppError('选题不存在', 404);
      }

      res.json({
        success: true,
        data: topic,
        message: '获取选题详情成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取选题详情失败', 500, error);
    }
  }

  // 更新选题
  async updateTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existing = await this.topicModel.findById(id);
      if (!existing) {
        throw new AppError('选题不存在', 404);
      }

      const updated = await this.topicModel.update(id, updateData);

      res.json({
        success: true,
        data: updated,
        message: '选题更新成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新选题失败', 500, error);
    }
  }

  // 更新选题状态
  async updateTopicStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('状态不能为空', 400);
      }

      const validStatuses = ['pending', 'selected', 'discarded', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new AppError('无效的状态值', 400);
      }

      const updated = await this.topicModel.updateStatus(id, status);

      if (!updated) {
        throw new AppError('选题不存在', 404);
      }

      res.json({
        success: true,
        data: updated,
        message: '选题状态更新成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新选题状态失败', 500, error);
    }
  }

  // 删除选题
  async deleteTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.topicModel.delete(id);

      if (!deleted) {
        throw new AppError('选题不存在', 404);
      }

      res.json({
        success: true,
        data: { id },
        message: '选题删除成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除选题失败', 500, error);
    }
  }

  // 选题质量评估
  async evaluateTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { criteria } = req.body;

      const topic = await this.topicModel.findById(id);
      if (!topic) {
        throw new AppError('选题不存在', 404);
      }

      // 使用AI进行质量评估
      const evaluationPrompt = `请对以下选题进行质量评估：

选题标题：${topic.title}
选题描述：${topic.description}
目标读者：${topic.target_audience || '公众号读者'}
难度级别：${topic.difficulty_level || 'intermediate'}
分类：${topic.category || '通用'}

请从以下维度进行评分（1-10分）：
1. 质量分数 - 内容价值、信息准确性、深度
2. 创意分数 - 原创性、新颖性、吸引力
3. 可行性分数 - 实现难度、资源需求、时间成本
4. 相关性分数 - 目标读者匹配度、时效性、实用性

请以JSON格式返回评估结果：
{
  "quality_score": 分数,
  "creativity_score": 分数,
  "feasibility_score": 分数,
  "relevance_score": 分数,
  "overall_score": 分数,
  "feedback": "评估反馈",
  "suggestions": ["改进建议1", "改进建议2"]
}`;

      const response = await this.geminiService.generateContent(evaluationPrompt, {
        model: 'gemini-pro'
      });

      let evaluation;
      try {
        evaluation = JSON.parse(response.content);
      } catch (error) {
        // 如果解析失败，使用默认评估
        evaluation = {
          quality_score: 7,
          creativity_score: 7,
          feasibility_score: 7,
          relevance_score: 7,
          overall_score: 7,
          feedback: '选题质量良好，建议进一步优化',
          suggestions: ['可以考虑增加更多实用价值', '建议明确目标读者群体']
        };
      }

      // 更新选题的评估分数
      const updated = await this.topicModel.update(id, {
        quality_score: evaluation.quality_score,
        creativity_score: evaluation.creativity_score,
        feasibility_score: evaluation.feasibility_score,
        relevance_score: evaluation.relevance_score,
        score: evaluation.overall_score
      });

      res.json({
        success: true,
        data: {
          topicId: id,
          evaluation,
          updatedTopic: updated
        },
        message: '选题评估完成'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('选题评估失败', 500, error);
    }
  }

  // 获取选题统计
  async getTopicStats(req: Request, res: Response) {
    try {
      const stats = await this.topicModel.getStats();

      res.json({
        success: true,
        data: stats,
        message: '获取选题统计成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取选题统计失败', 500, error);
    }
  }

  // 获取素材相关的选题
  async getTopicsByMaterial(req: Request, res: Response) {
    try {
      const { materialId } = req.params;
      const { status } = req.query;

      const topics = await this.topicModel.findByMaterialId(materialId);
      
      let filteredTopics = topics;
      if (status) {
        filteredTopics = topics.filter(topic => topic.status === status);
      }

      res.json({
        success: true,
        data: {
          topics: filteredTopics,
          total: filteredTopics.length,
          materialId
        },
        message: '获取素材相关选题成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取素材相关选题失败', 500, error);
    }
  }

  // 批量操作选题
  async batchUpdateTopics(req: Request, res: Response) {
    try {
      const { topicIds, action, data } = req.body;

      if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
        throw new AppError('选题ID列表不能为空', 400);
      }

      if (!action) {
        throw new AppError('操作类型不能为空', 400);
      }

      const validActions = ['update_status', 'delete', 'update_category', 'update_tags'];
      if (!validActions.includes(action)) {
        throw new AppError('无效的操作类型', 400);
      }

      const results = [];
      for (const topicId of topicIds) {
        try {
          let result;
          switch (action) {
            case 'update_status':
              result = await this.topicModel.updateStatus(topicId, data.status);
              break;
            case 'delete':
              result = await this.topicModel.delete(topicId);
              break;
            case 'update_category':
              result = await this.topicModel.update(topicId, { category: data.category });
              break;
            case 'update_tags':
              result = await this.topicModel.update(topicId, { tags: data.tags });
              break;
          }
          results.push({ topicId, success: true, result });
        } catch (error) {
          results.push({
            topicId,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            totalTopics: topicIds.length,
            successCount,
            failureCount: topicIds.length - successCount,
            action
          }
        },
        message: `批量操作完成，成功处理${successCount}/${topicIds.length}个选题`
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('批量操作选题失败', 500, error);
    }
  }

  // 辅助方法：为单个素材生成选题
  private async generateTopicsForMaterial(materialId: string, options: {
    templateId?: string;
    customPrompt?: string;
    count?: number;
    category?: string;
    style?: string;
    targetAudience?: string;
    difficultyLevel?: string;
  }) {
    const material = await this.materialModel.findById(materialId);
    if (!material) {
      throw new AppError(`素材 ${materialId} 不存在`, 404);
    }

    // 构建prompt
    let prompt = options.customPrompt;
    if (!prompt && options.templateId) {
      const template = await this.templateModel.findById(options.templateId);
      if (!template) {
        throw new AppError(`模板 ${options.templateId} 不存在`, 404);
      }
      prompt = await this.templateModel.renderTemplate(options.templateId, {
        material: material.content,
        count: options.count || 5,
        style: options.style || '专业科普',
        category: options.category || '通用',
        targetAudience: options.targetAudience || '公众号读者',
        difficultyLevel: options.difficultyLevel || 'intermediate'
      });
    }

    if (!prompt) {
      prompt = `基于以下素材，为我生成${options.count || 5}个适合公众号文章的选题建议。

素材内容：
${material.content}

写作风格：${options.style || '专业科普'}
目标读者：${options.targetAudience || '公众号读者'}
难度级别：${options.difficultyLevel || 'intermediate'}
分类：${options.category || '通用'}

要求：
1. 选题要具有时效性和实用性
2. 符合公众号读者阅读习惯
3. 避免敏感话题
4. 突出实用价值
5. 标题要吸引人，但避免标题党

请以JSON格式返回，包含topics数组，每个topic有：
- id: 唯一标识符
- title: 吸引人的标题
- description: 简要描述（100字以内）
- audience: 目标读者群体
- value: 预计传播价值
- keywords: 相关关键词数组
- score: 选题评分（1-10分）

返回格式：
{
  "topics": [...]
}`;
    }

    // 生成选题
    const suggestions = await this.geminiService.generateTopics(material.content, {
      count: options.count || 5,
      style: options.style || '专业科普',
      model: 'gemini-pro'
    });

    // 转换为Topic格式并保存
    const topics: Topic[] = [];
    for (const suggestion of suggestions) {
      const topicData: CreateTopicDto = {
        title: suggestion.title,
        description: suggestion.description,
        material_id: materialId,
        prompt,
        category: options.category || '通用',
        tags: suggestion.keywords,
        keywords: suggestion.keywords,
        target_audience: suggestion.audience,
        difficulty_level: options.difficultyLevel as any,
        template_id: options.templateId
      };

      const topic = await this.topicModel.create(topicData);
      topics.push(topic);
    }

    return {
      topics,
      total: topics.length
    };
  }
}