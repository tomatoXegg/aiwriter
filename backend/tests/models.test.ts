import Database from '../src/database/init';
import { AccountModel } from '../src/database/models/Account';

describe('Account Model', () => {
  let db: Database;
  let model: AccountModel;

  beforeEach(() => {
    db = new Database();
    model = new AccountModel(db);
    
    // Mock database methods
    jest.spyOn(db, 'run').mockResolvedValue({ id: 1, changes: 1 });
    jest.spyOn(db, 'get').mockResolvedValue(null);
    jest.spyOn(db, 'all').mockResolvedValue([]);
  });

  describe('create', () => {
    test('should create account with valid data', async () => {
      const accountData = {
        name: 'Test Account',
        description: 'Test description',
        platform: 'wechat' as const
      };

      const mockRow = {
        id: 'test-id',
        ...accountData,
        status: 'active',
        content_count: 0,
        created_at: new Date().toISOString()
      };

      jest.spyOn(db, 'run').mockResolvedValue({ id: 1, changes: 1 });

      const result = await model.create(accountData);
      
      expect(result).toEqual(mockRow);
      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO accounts'),
        expect.arrayContaining([
          'test-id',
          accountData.name,
          accountData.description,
          accountData.platform,
          'active',
          0,
          expect.any(String)
        ])
      );
    });

    test('should use default values when not provided', async () => {
      const accountData = {
        name: 'Test Account'
      };

      await model.create(accountData);
      
      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO accounts'),
        expect.arrayContaining([
          expect.any(String),
          accountData.name,
          null, // description
          'wechat', // default platform
          'active', // default status
          0, // default content_count
          expect.any(String)
        ])
      );
    });
  });

  describe('findById', () => {
    test('should return account when found', async () => {
      const mockRow = {
        id: 'test-id',
        name: 'Test Account',
        description: 'Test description',
        platform: 'wechat',
        status: 'active',
        content_count: 0,
        created_at: new Date().toISOString()
      };

      jest.spyOn(db, 'get').mockResolvedValue(mockRow);

      const result = await model.findById('test-id');
      
      expect(result).toEqual(mockRow);
      expect(db.get).toHaveBeenCalledWith('SELECT * FROM accounts WHERE id = ?', ['test-id']);
    });

    test('should return null when not found', async () => {
      jest.spyOn(db, 'get').mockResolvedValue(null);

      const result = await model.findById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should return paginated accounts', async () => {
      const mockRows = [
        { id: '1', name: 'Account 1' },
        { id: '2', name: 'Account 2' }
      ];
      const mockCount = { total: 2 };

      jest.spyOn(db, 'all').mockResolvedValue(mockRows);
      jest.spyOn(db, 'get').mockResolvedValue(mockCount);

      const result = await model.findAll({ page: 1, limit: 10 });
      
      expect(result).toEqual({
        data: mockRows,
        total: 2
      });
    });

    test('should apply filters when provided', async () => {
      jest.spyOn(db, 'all').mockResolvedValue([]);
      jest.spyOn(db, 'get').mockResolvedValue({ total: 0 });

      await model.findAll({ 
        status: 'active', 
        platform: 'wechat',
        search: 'test'
      });
      
      expect(db.get).toHaveBeenCalledWith(
        expect.stringContaining('AND status = ? AND platform = ? AND (name LIKE ? OR description LIKE ?)'),
        expect.arrayContaining(['active', 'wechat', '%test%', '%test%'])
      );
    });
  });

  describe('update', () => {
    test('should update account with valid data', async () => {
      const existingAccount = {
        id: 'test-id',
        name: 'Old Name',
        description: 'Old description',
        platform: 'wechat',
        status: 'active',
        content_count: 0,
        created_at: new Date().toISOString()
      };

      const updateData = {
        name: 'New Name',
        description: 'New description'
      };

      jest.spyOn(db, 'get').mockResolvedValue(existingAccount);
      jest.spyOn(db, 'run').mockResolvedValue({ id: 1, changes: 1 });

      await model.update('test-id', updateData);
      
      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE accounts SET name = ?, description = ?, updated_at = ? WHERE id = ?'),
        expect.arrayContaining([
          updateData.name,
          updateData.description,
          expect.any(String),
          'test-id'
        ])
      );
    });

    test('should return null when account not found', async () => {
      jest.spyOn(db, 'get').mockResolvedValue(null);

      const result = await model.update('non-existent-id', { name: 'New Name' });
      
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    test('should delete account and return true', async () => {
      jest.spyOn(db, 'run').mockResolvedValue({ id: 1, changes: 1 });

      const result = await model.delete('test-id');
      
      expect(result).toBe(true);
      expect(db.run).toHaveBeenCalledWith('DELETE FROM accounts WHERE id = ?', ['test-id']);
    });

    test('should return false when account not found', async () => {
      jest.spyOn(db, 'run').mockResolvedValue({ id: 1, changes: 0 });

      const result = await model.delete('non-existent-id');
      
      expect(result).toBe(false);
    });
  });

  describe('incrementContentCount', () => {
    test('should increment content count', async () => {
      await model.incrementContentCount('test-id');
      
      expect(db.run).toHaveBeenCalledWith(
        'UPDATE accounts SET content_count = content_count + 1, updated_at = ? WHERE id = ?',
        [expect.any(String), 'test-id']
      );
    });
  });

  describe('getStats', () => {
    test('should return account statistics', async () => {
      const mockStats = {
        total: 5,
        active: 3,
        inactive: 2,
        byPlatform: { wechat: 3, weibo: 2 }
      };

      jest.spyOn(db, 'get').mockResolvedValue({ total: 5 });
      jest.spyOn(db, 'get').mockResolvedValue({ active: 3 });
      jest.spyOn(db, 'get').mockResolvedValue({ inactive: 2 });
      jest.spyOn(db, 'all').mockResolvedValue([
        { platform: 'wechat', count: 3 },
        { platform: 'weibo', count: 2 }
      ]);

      const result = await model.getStats();
      
      expect(result).toEqual(mockStats);
    });
  });
});