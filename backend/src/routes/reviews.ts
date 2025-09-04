import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { validate, validationSchemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import ResponseBuilder from '../utils/responseBuilder';
import databaseConfig from '../config/database';
import { Review, CreateReviewRequest } from '../types/models';

const router = Router();

// GET /api/reviews - Get all reviews
router.get('/', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    const reviews = await db.all(`
      SELECT r.*, c.title as content_title 
      FROM reviews r 
      LEFT JOIN contents c ON r.content_id = c.id 
      ORDER BY r.reviewed_at DESC
    `);
    
    ResponseBuilder.success(res, reviews, 'Reviews retrieved successfully');
  } catch (error) {
    throw new AppError('Failed to retrieve reviews', 500);
  }
}));

// GET /api/reviews/:id - Get specific review
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    const review = await db.get(`
      SELECT r.*, c.title as content_title, c.body as content_body
      FROM reviews r 
      LEFT JOIN contents c ON r.content_id = c.id 
      WHERE r.id = ?
    `, [req.params.id]);
    
    if (!review) {
      throw new AppError('Review not found', 404);
    }
    
    ResponseBuilder.success(res, review, 'Review retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve review', 500);
  }
}));

// GET /api/reviews/content/:contentId - Get reviews for specific content
router.get('/content/:contentId', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    const reviews = await db.all(`
      SELECT r.*, c.title as content_title
      FROM reviews r 
      LEFT JOIN contents c ON r.content_id = c.id 
      WHERE r.content_id = ?
      ORDER BY r.reviewed_at DESC
    `, [req.params.contentId]);
    
    ResponseBuilder.success(res, reviews, 'Content reviews retrieved successfully');
  } catch (error) {
    throw new AppError('Failed to retrieve content reviews', 500);
  }
}));

// POST /api/reviews - Create new review
router.post('/', validate(validationSchemas.review), asyncHandler(async (req, res) => {
  try {
    const { content_id, quality, originality, suggestions } = req.body as CreateReviewRequest;
    
    if (!content_id) {
      throw new AppError('Content ID is required', 400);
    }
    
    // Check if content exists
    const db = databaseConfig.getInstance();
    const content = await db.get('SELECT * FROM contents WHERE id = ?', [content_id]);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    const newReview: Review = {
      id: uuidv4(),
      content_id,
      quality,
      originality,
      suggestions: suggestions || [],
      status: 'pending',
      reviewed_at: new Date().toISOString()
    };

    await db.run(
      `INSERT INTO reviews (id, content_id, quality, originality, suggestions, status, reviewed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newReview.id, newReview.content_id, newReview.quality, newReview.originality, 
       JSON.stringify(newReview.suggestions), newReview.status, newReview.reviewed_at]
    );

    ResponseBuilder.created(res, newReview, 'Review created successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create review', 500);
  }
}));

// PUT /api/reviews/:id - Update review
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const { quality, originality, suggestions, status } = req.body;
    const db = databaseConfig.getInstance();
    
    // Check if review exists
    const existingReview = await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!existingReview) {
      throw new AppError('Review not found', 404);
    }

    const updatedReview = {
      ...existingReview,
      quality: quality !== undefined ? quality : existingReview.quality,
      originality: originality !== undefined ? originality : existingReview.originality,
      suggestions: suggestions !== undefined ? suggestions : JSON.parse(existingReview.suggestions || '[]'),
      status: status || existingReview.status,
      reviewed_at: new Date().toISOString()
    };

    await db.run(
      `UPDATE reviews SET quality = ?, originality = ?, suggestions = ?, status = ?, reviewed_at = ? WHERE id = ?`,
      [updatedReview.quality, updatedReview.originality, JSON.stringify(updatedReview.suggestions), 
       updatedReview.status, updatedReview.reviewed_at, req.params.id]
    );

    ResponseBuilder.success(res, updatedReview, 'Review updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update review', 500);
  }
}));

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    
    // Check if review exists
    const existingReview = await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!existingReview) {
      throw new AppError('Review not found', 404);
    }

    await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    
    ResponseBuilder.noContent(res);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete review', 500);
  }
}));

export default router;