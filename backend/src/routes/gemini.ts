import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import ResponseBuilder from '../utils/responseBuilder';
import enhancedGeminiService, { 
  GeminiRequest,
  ChatMessage,
  ChatSession
} from '../services/enhancedGeminiService';
import { 
  geminiRateLimit, 
  generateRateLimit, 
  chatRateLimit,
  checkGeminiConfig,
  validateRequestSize,
  logApiUsage
} from '../middleware/geminiLimiter';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 应用全局中间件
router.use(checkGeminiConfig);
router.use(geminiRateLimit);
router.use(logApiUsage);

// 存储聊天会话的内存存储（生产环境应使用数据库）
const chatSessions: Map<string, ChatSession> = new Map();

// POST /api/gemini/generate - 基础内容生成
router.post('/generate', generateRateLimit, validateRequestSize(10000), asyncHandler(async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;
    const accountId = req.user?.id;

    if (!prompt || typeof prompt !== 'string') {
      throw new AppError('Prompt is required and must be a string', 400);
    }

    if (prompt.length > 10000) {
      throw new AppError('Prompt too long. Maximum 10,000 characters allowed.', 400);
    }

    const response = await enhancedGeminiService.generateContent(prompt, {
      model,
      temperature,
      maxTokens,
      accountId
    });

    ResponseBuilder.success(res, {
      id: response.id,
      content: response.content,
      model: response.model,
      usage: response.usage,
      metadata: response.metadata
    }, 'Content generated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate content', 500);
  }
}));

// POST /api/gemini/topics - 选题生成
router.post('/topics', generateRateLimit, validateRequestSize(5000), asyncHandler(async (req, res) => {
  try {
    const { material, count, style, model } = req.body;
    const accountId = req.user?.id;

    if (!material || typeof material !== 'string') {
      throw new AppError('Material is required and must be a string', 400);
    }

    if (material.length > 5000) {
      throw new AppError('Material too long. Maximum 5,000 characters allowed.', 400);
    }

    const topics = await enhancedGeminiService.generateTopics(material, {
      count: count || 5,
      style,
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      topics,
      count: topics.length,
      material: material.substring(0, 100) + '...'
    }, 'Topics generated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate topics', 500);
  }
}));

// POST /api/gemini/optimize - 内容优化
router.post('/optimize', generateRateLimit, validateRequestSize(10000), asyncHandler(async (req, res) => {
  try {
    const { content, focus, targetAudience, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    if (content.length > 10000) {
      throw new AppError('Content too long. Maximum 10,000 characters allowed.', 400);
    }

    const result = await enhancedGeminiService.optimizeContent(content, {
      focus,
      targetAudience,
      model,
      accountId
    });

    ResponseBuilder.success(res, result, 'Content optimized successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to optimize content', 500);
  }
}));

// POST /api/gemini/summarize - 内容摘要
router.post('/summarize', generateRateLimit, validateRequestSize(20000), asyncHandler(async (req, res) => {
  try {
    const { content, length, style, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    const summary = await enhancedGeminiService.summarizeContent(content, {
      length,
      style,
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      summary,
      originalLength: content.length,
      summaryLength: summary.length
    }, 'Content summarized successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to summarize content', 500);
  }
}));

// POST /api/gemini/keywords - 关键词提取
router.post('/keywords', generateRateLimit, validateRequestSize(20000), asyncHandler(async (req, res) => {
  try {
    const { content, count, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    const keywords = await enhancedGeminiService.extractKeywords(content, {
      count: count || 10,
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      keywords,
      count: keywords.length
    }, 'Keywords extracted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to extract keywords', 500);
  }
}));

// POST /api/gemini/chat - 多轮对话
router.post('/chat', chatRateLimit, validateRequestSize(50000), asyncHandler(async (req, res) => {
  try {
    const { messages, context, conversationId, model } = req.body;
    const accountId = req.user?.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new AppError('Messages array is required', 400);
    }

    // 验证消息格式
    const isValidMessage = messages.every((msg: any) => 
      msg.role && ['user', 'assistant'].includes(msg.role) && 
      typeof msg.content === 'string'
    );

    if (!isValidMessage) {
      throw new AppError('Invalid message format. Each message must have role (user/assistant) and content', 400);
    }

    // 获取或创建会话
    let sessionId = conversationId;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    let session = chatSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        messages: [],
        context,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      chatSessions.set(sessionId, session);
    }

    // 构建对话历史
    const conversationHistory = session.messages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    // 构建提示
    const prompt = context 
      ? `上下文：${context}\n\n对话历史：\n${conversationHistory}\n\n用户：${messages[messages.length - 1].content}\n\n请以Assistant的身份回复：`
      : `对话历史：\n${conversationHistory}\n\n用户：${messages[messages.length - 1].content}\n\n请以Assistant的身份回复：`;

    // 获取AI回复
    const response = await enhancedGeminiService.generateContent(prompt, {
      model,
      accountId
    });

    // 更新会话
    session.messages.push({
      role: 'user',
      content: messages[messages.length - 1].content,
      timestamp: new Date()
    });
    session.messages.push({
      role: 'assistant',
      content: response.content,
      timestamp: new Date()
    });
    session.updatedAt = new Date();

    ResponseBuilder.success(res, {
      response: response.content,
      conversationId: sessionId,
      usage: response.usage,
      metadata: response.metadata
    }, 'Chat response generated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate chat response', 500);
  }
}));

// GET /api/gemini/chat/:conversationId - 获取对话历史
router.get('/chat/:conversationId', asyncHandler(async (req, res) => {
  try {
    const { conversationId } = req.params;
    const accountId = req.user?.id;

    const session = chatSessions.get(conversationId);
    if (!session) {
      throw new AppError('Conversation not found', 404);
    }

    ResponseBuilder.success(res, {
      conversationId: session.id,
      messages: session.messages,
      context: session.context,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }, 'Conversation retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve conversation', 500);
  }
}));

// POST /api/gemini/style - 风格转换
router.post('/style', generateRateLimit, validateRequestSize(10000), asyncHandler(async (req, res) => {
  try {
    const { content, targetStyle, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    if (!targetStyle) {
      throw new AppError('Target style is required', 400);
    }

    const prompt = `请将以下内容转换为"${targetStyle}"风格。

原内容：
${content}

要求：
- 保持原意不变
- 调整语言风格和表达方式
- 适应目标读者群体
- 保持内容质量

请直接输出转换后的内容。`;

    const response = await enhancedGeminiService.generateContent(prompt, {
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      originalContent: content,
      styledContent: response.content,
      targetStyle,
      usage: response.usage
    }, 'Content style converted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to convert content style', 500);
  }
}));

// POST /api/gemini/expand - 内容扩展
router.post('/expand', generateRateLimit, validateRequestSize(10000), asyncHandler(async (req, res) => {
  try {
    const { content, expansionPoints, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    const points = expansionPoints?.join(', ') || '添加更多细节、例子和解释';

    const prompt = `请扩展以下内容，重点关注：${points}

原内容：
${content}

要求：
- 保持原有结构和逻辑
- 添加相关的例子和数据
- 深化分析和解释
- 增强说服力和可读性

请直接输出扩展后的内容。`;

    const response = await enhancedGeminiService.generateContent(prompt, {
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      originalContent: content,
      expandedContent: response.content,
      expansionPoints,
      usage: response.usage
    }, 'Content expanded successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to expand content', 500);
  }
}));

// POST /api/gemini/rewrite - 内容改写
router.post('/rewrite', generateRateLimit, validateRequestSize(10000), asyncHandler(async (req, res) => {
  try {
    const { content, rewriteType, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    const typeMap = {
      'simplify': '简化表达',
      'professional': '更专业',
      'casual': '更轻松随意',
      'formal': '更正式',
      'creative': '更有创意'
    };

    const type = typeMap[rewriteType as keyof typeof typeMap] || '改写';

    const prompt = `请${type}以下内容，保持核心意思不变。

原内容：
${content}

要求：
- 保持核心观点和事实
- 调整表达方式和语气
- 优化语言流畅度
- 避免重复和冗余

请直接输出改写后的内容。`;

    const response = await enhancedGeminiService.generateContent(prompt, {
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      originalContent: content,
      rewrittenContent: response.content,
      rewriteType,
      usage: response.usage
    }, 'Content rewritten successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to rewrite content', 500);
  }
}));

// POST /api/gemini/translate - 内容翻译
router.post('/translate', generateRateLimit, validateRequestSize(10000), asyncHandler(async (req, res) => {
  try {
    const { content, targetLanguage, sourceLanguage, model } = req.body;
    const accountId = req.user?.id;

    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    if (!targetLanguage) {
      throw new AppError('Target language is required', 400);
    }

    const source = sourceLanguage ? `从${sourceLanguage}` : '';
    const prompt = `请将以下内容${source}翻译成${targetLanguage}。

内容：
${content}

要求：
- 准确传达原意
- 保持语言流畅自然
- 符合目标语言表达习惯
- 保留专业术语的准确性

请直接输出翻译结果。`;

    const response = await enhancedGeminiService.generateContent(prompt, {
      model,
      accountId
    });

    ResponseBuilder.success(res, {
      originalContent: content,
      translatedContent: response.content,
      sourceLanguage: sourceLanguage || 'auto-detected',
      targetLanguage,
      usage: response.usage
    }, 'Content translated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to translate content', 500);
  }
}));

// GET /api/gemini/statistics - API统计
router.get('/statistics', asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const statistics = enhancedGeminiService.getStatistics({
      startDate: startDate as string,
      endDate: endDate as string
    });

    // 计算成功率
    const successRate = statistics.totalRequests > 0 
      ? (statistics.successfulRequests / statistics.totalRequests * 100).toFixed(2)
      : '0';

    ResponseBuilder.success(res, {
      ...statistics,
      successRate: `${successRate}%`
    }, 'Statistics retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve statistics', 500);
  }
}));

// GET /api/gemini/status - 服务状态
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const status = enhancedGeminiService.getStatus();

    ResponseBuilder.success(res, status, 'Service status retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve service status', 500);
  }
}));

export default router;