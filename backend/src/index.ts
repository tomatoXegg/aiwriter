import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import middleware and utilities
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, errorLogger } from './middleware/logging';
import { authenticate, optionalAuth } from './middleware/auth';

// Import routes
import accountsRouter from './routes/accounts';
import reviewsRouter from './routes/reviews';
import aiRouter from './routes/ai';
import createMaterialsRouter from './routes/materials';
import geminiRouter from './routes/gemini';
import topicsRouter from './routes/topics';
import templatesRouter from './routes/templates';
import { createContentRouter } from './routes/content';

// Import database configuration
import databaseConfig from './config/database';
import { createModels } from './database/models';
import { FileUploadService } from './services';
import { ContentGenerationService } from './services/contentGenerationService';
import { BatchContentGenerationService } from './services/batchContentGenerationService';
import { ContentOptimizationService } from './services/contentOptimizationService';
import geminiService from './services/geminiService';

// Initialize models and services
const models = createModels(databaseConfig.getDatabase());
const fileUploadService = new FileUploadService();
const contentGenerationService = new ContentGenerationService(models, geminiService);
const batchGenerationService = new BatchContentGenerationService(models, contentGenerationService);
const optimizationService = new ContentOptimizationService(models, geminiService);

const app = express();
const PORT = process.env.PORT || 8000;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use(limiter);

// Request logging
app.use(requestLogger);

// Health check route (no authentication required)
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API documentation route (no authentication required)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'AI Writer API',
    version: '1.0.0',
    description: 'AI-powered content generation platform',
    endpoints: {
      accounts: '/api/accounts',
      materials: '/api/materials',
      reviews: '/api/reviews',
      ai: '/api/ai',
      gemini: '/api/gemini',
      topics: '/api/topics',
      templates: '/api/templates',
      content: '/api/content',
      health: '/health',
      docs: '/api'
    },
    features: [
      'Account management',
      'Material management with file upload',
      'Category and tag system',
      'Advanced search and filtering',
      'AI-powered topic generation',
      'AI-powered content creation',
      'Content quality review',
      'Google Gemini integration',
      'Topic management and evaluation',
      'Prompt template system',
      'Topic analytics and recommendations',
      'Batch content generation',
      'Content version management',
      'Content optimization and analysis',
      'Style and length control',
      'RESTful API'
    ]
  });
});

// API routes with authentication
app.use('/api/accounts', optionalAuth, accountsRouter);
app.use('/api/materials', authenticate, createMaterialsRouter(models, fileUploadService));
app.use('/api/reviews', authenticate, reviewsRouter);
app.use('/api/ai', authenticate, aiRouter);
app.use('/api/gemini', authenticate, geminiRouter);
app.use('/api/topics', authenticate, topicsRouter);
app.use('/api/templates', authenticate, templatesRouter);
app.use('/api/content', authenticate, createContentRouter(models, contentGenerationService, batchGenerationService, optimizationService));

// Error handling middleware
app.use(errorLogger);
app.use(errorHandler);
app.use(notFoundHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await databaseConfig.initialize();
    console.log('✅ Database initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 AI Writer Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API documentation: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
      console.log(`🔐 Authentication: ${process.env.API_KEY ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  try {
    await databaseConfig.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  try {
    await databaseConfig.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;