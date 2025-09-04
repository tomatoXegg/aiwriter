import request from 'supertest';
import app from '../src/index';
import { createModels } from '../src/database/models';
import { FileUploadService } from '../src/services';
import databaseConfig from '../src/config/database';

describe('Materials API', () => {
  let models: any;
  let fileUploadService: FileUploadService;
  let authToken: string;

  beforeAll(async () => {
    // Initialize database
    await databaseConfig.initialize();
    models = createModels(databaseConfig.getDatabase());
    fileUploadService = new FileUploadService();

    // Run migrations
    const migrationManager = require('../src/database/migrations/MigrationManager').default;
    await migrationManager.runMigrations('up');

    // Create a test account and get auth token
    const account = await models.account.create({
      name: 'Test Account',
      description: 'Test account for materials API',
      platform: 'other'
    });

    // In a real app, you would get a proper JWT token
    authToken = 'test-token';
  });

  afterAll(async () => {
    await databaseConfig.close();
  });

  describe('Categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Technology',
        description: 'Technology related materials',
        color: '#3B82F6'
      };

      const response = await request(app)
        .post('/api/materials/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.description).toBe(categoryData.description);
      expect(response.body.data.color).toBe(categoryData.color);
    });

    it('should get categories list', async () => {
      const response = await request(app)
        .get('/api/materials/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });

    it('should update a category', async () => {
      // First create a category
      const category = await models.category.create({
        name: 'Test Category',
        description: 'Test description',
        color: '#FF0000'
      });

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
        color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/materials/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should delete a category', async () => {
      // First create a category
      const category = await models.category.create({
        name: 'To Delete',
        description: 'This category will be deleted',
        color: '#FF0000'
      });

      const response = await request(app)
        .delete(`/api/materials/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });

  describe('Tags', () => {
    it('should create a new tag', async () => {
      const tagData = {
        name: 'AI',
        color: '#10B981'
      };

      const response = await request(app)
        .post('/api/materials/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(tagData.name);
      expect(response.body.data.color).toBe(tagData.color);
      expect(response.body.data.usage_count).toBe(0);
    });

    it('should get tags list', async () => {
      const response = await request(app)
        .get('/api/materials/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toBeDefined();
      expect(Array.isArray(response.body.data.tags)).toBe(true);
    });

    it('should get popular tags', async () => {
      const response = await request(app)
        .get('/api/materials/tags/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Materials', () => {
    it('should create a text material', async () => {
      const materialData = {
        title: 'Test Material',
        content: 'This is a test material content',
        tags: ['test', 'sample'],
        category_id: 'test-category-id'
      };

      const response = await request(app)
        .post('/api/materials/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send(materialData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(materialData.title);
      expect(response.body.data.content).toBe(materialData.content);
      expect(response.body.data.type).toBe('text');
    });

    it('should get materials list', async () => {
      const response = await request(app)
        .get('/api/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toBeDefined();
      expect(Array.isArray(response.body.data.materials)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should search materials', async () => {
      const response = await request(app)
        .get('/api/materials/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.materials).toBeDefined();
      expect(response.body.data.searchQuery).toBe('test');
    });

    it('should get material by id', async () => {
      // First create a material
      const material = await models.material.create({
        title: 'Test Material for Get',
        content: 'This is a test material',
        type: 'text'
      });

      const response = await request(app)
        .get(`/api/materials/${material.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(material.id);
      expect(response.body.data.title).toBe(material.title);
    });

    it('should update a material', async () => {
      // First create a material
      const material = await models.material.create({
        title: 'Test Material for Update',
        content: 'Original content',
        type: 'text'
      });

      const updateData = {
        title: 'Updated Material',
        content: 'Updated content'
      };

      const response = await request(app)
        .put(`/api/materials/${material.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
    });

    it('should delete a material', async () => {
      // First create a material
      const material = await models.material.create({
        title: 'Test Material for Delete',
        content: 'This material will be deleted',
        type: 'text'
      });

      const response = await request(app)
        .delete(`/api/materials/${material.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });

  describe('Statistics', () => {
    it('should get material statistics', async () => {
      const response = await request(app)
        .get('/api/materials/stats/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
    });

    it('should get category statistics', async () => {
      const response = await request(app)
        .get('/api/materials/stats/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
    });

    it('should get tag statistics', async () => {
      const response = await request(app)
        .get('/api/materials/stats/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent material', async () => {
      const response = await request(app)
        .get('/api/materials/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid category creation', async () => {
      const response = await request(app)
        .post('/api/materials/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required name field
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid tag creation', async () => {
      const response = await request(app)
        .post('/api/materials/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required name field
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});