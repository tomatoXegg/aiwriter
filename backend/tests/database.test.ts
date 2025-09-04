import Database from '../src/database/init';
import { DatabaseService } from '../src/database/services/DatabaseService';

describe('Database Service', () => {
  let db: Database;
  let service: DatabaseService;

  beforeAll(async () => {
    // Use in-memory database for testing
    db = new Database();
    service = new DatabaseService(db);
    
    // Mock the database path to use in-memory database
    jest.spyOn(db as any, 'connect').mockImplementation(async () => {
      (db as any).db = {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn()
      };
    });
    
    await service.initialize();
  });

  afterAll(async () => {
    await service.close();
  });

  describe('Account Operations', () => {
    test('should create account with valid data', async () => {
      const accountData = {
        name: 'Test Account',
        description: 'Test description',
        platform: 'wechat'
      };

      const mockAccount = {
        id: 'test-id',
        ...accountData,
        status: 'active',
        content_count: 0,
        created_at: new Date().toISOString()
      };

      // Mock the model method
      jest.spyOn(service['models'].account, 'create').mockResolvedValue(mockAccount);

      const result = await service.createAccount(accountData);
      
      expect(result).toEqual(mockAccount);
      expect(service['models'].account.create).toHaveBeenCalledWith(accountData);
    });

    test('should validate account data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        platform: 'invalid' // Invalid: not a valid platform
      };

      await expect(service.createAccount(invalidData)).rejects.toThrow('Validation failed');
    });

    test('should get accounts with pagination', async () => {
      const mockAccounts = {
        data: [
          { id: '1', name: 'Account 1' },
          { id: '2', name: 'Account 2' }
        ],
        total: 2
      };

      jest.spyOn(service['models'].account, 'findAll').mockResolvedValue(mockAccounts);

      const result = await service.getAccounts({ page: 1, limit: 10 });
      
      expect(result).toEqual(mockAccounts);
      expect(service['models'].account.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('Content Operations', () => {
    test('should create content with valid data', async () => {
      const contentData = {
        title: 'Test Content',
        body: 'Test content body',
        account_id: 'test-account-id'
      };

      const mockContent = {
        id: 'test-content-id',
        ...contentData,
        status: 'draft',
        word_count: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      jest.spyOn(service['models'].content, 'create').mockResolvedValue(mockContent);
      jest.spyOn(service['models'].account, 'incrementContentCount').mockResolvedValue();

      const result = await service.createContent(contentData);
      
      expect(result).toEqual(mockContent);
      expect(service['models'].content.create).toHaveBeenCalledWith(contentData);
      expect(service['models'].account.incrementContentCount).toHaveBeenCalledWith('test-account-id');
    });

    test('should validate content data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        body: '' // Invalid: empty body
      };

      await expect(service.createContent(invalidData)).rejects.toThrow('Validation failed');
    });

    test('should publish content', async () => {
      const mockContent = {
        id: 'test-id',
        title: 'Test Content',
        status: 'published'
      };

      jest.spyOn(service['models'].content, 'publish').mockResolvedValue(mockContent);

      const result = await service.publishContent('test-id');
      
      expect(result).toEqual(mockContent);
      expect(service['models'].content.publish).toHaveBeenCalledWith('test-id');
    });
  });

  describe('Configuration Operations', () => {
    test('should create configuration', async () => {
      const configData = {
        key: 'test_key',
        value: 'test_value',
        type: 'string'
      };

      const mockConfig = {
        id: 'test-config-id',
        ...configData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      jest.spyOn(service['models'].configuration, 'create').mockResolvedValue(mockConfig);

      const result = await service.createConfiguration(configData);
      
      expect(result).toEqual(mockConfig);
      expect(service['models'].configuration.create).toHaveBeenCalledWith(configData);
    });

    test('should get configuration by key', async () => {
      const mockConfig = {
        id: 'test-id',
        key: 'test_key',
        value: 'test_value',
        type: 'string'
      };

      jest.spyOn(service['models'].configuration, 'findByKey').mockResolvedValue(mockConfig);

      const result = await service.getConfigurationByKey('test_key');
      
      expect(result).toEqual(mockConfig);
      expect(service['models'].configuration.findByKey).toHaveBeenCalledWith('test_key');
    });
  });

  describe('Database Operations', () => {
    test('should get database status', async () => {
      const mockStatus = {
        connected: true,
        tables: ['accounts', 'contents'],
        path: '/path/to/database.db'
      };

      jest.spyOn(db, 'getStatus').mockResolvedValue(mockStatus);

      const result = await service.getStatus();
      
      expect(result).toEqual(mockStatus);
    });

    test('should search content', async () => {
      const mockResults = {
        data: [
          { id: '1', title: 'Test Content 1' },
          { id: '2', title: 'Test Content 2' }
        ],
        total: 2
      };

      jest.spyOn(require('../src/database/utils'), 'search').mockResolvedValue(mockResults);

      const result = await service.searchContent('test');
      
      expect(result).toEqual({
        ...mockResults,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      jest.spyOn(db, 'connect').mockRejectedValue(new Error('Connection failed'));

      const newService = new DatabaseService(db);
      await expect(newService.initialize()).rejects.toThrow('Connection failed');
    });

    test('should handle validation errors', async () => {
      const invalidData = {
        name: '' // Invalid: empty name
      };

      await expect(service.createAccount(invalidData)).rejects.toThrow();
    });
  });
});