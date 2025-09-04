import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import ResponseBuilder from '../utils/responseBuilder';
import geminiService, { 
  TopicSuggestion, 
  GeneratedContent, 
  ContentReview,
  GenerateTopicsOptions,
  GenerateContentOptions
} from '../services/geminiService';

const router = Router();

// POST /api/ai/topics - Generate topics from material
router.post('/topics', asyncHandler(async (req, res) => {
  try {
    const { material, options } = req.body;
    
    if (!material || typeof material !== 'string') {
      throw new AppError('Material is required and must be a string', 400);
    }

    const topics = await geminiService.generateTopics(material, options as GenerateTopicsOptions);
    
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

// POST /api/ai/content - Generate content from topic
router.post('/content', asyncHandler(async (req, res) => {
  try {
    const { topic, options } = req.body;
    
    if (!topic || !topic.title) {
      throw new AppError('Topic with title is required', 400);
    }

    const content = await geminiService.generateContent(topic, options as GenerateContentOptions);
    
    ResponseBuilder.success(res, content, 'Content generated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate content', 500);
  }
}));

// POST /api/ai/review - Review content quality
router.post('/review', asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      throw new AppError('Content is required and must be a string', 400);
    }

    const review = await geminiService.reviewContent(content);
    
    ResponseBuilder.success(res, review, 'Content review completed successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to review content', 500);
  }
}));

// GET /api/ai/status - Check AI service status
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const isConfigured = !!process.env.GEMINI_API_KEY;
    
    ResponseBuilder.success(res, {
      service: 'Google Gemini AI',
      configured: isConfigured,
      model: 'gemini-pro',
      features: [
        'Topic generation',
        'Content generation',
        'Content review',
        'Chinese language support'
      ]
    }, 'AI service status retrieved successfully');
  } catch (error) {
    throw new AppError('Failed to check AI service status', 500);
  }
}));

export default router;