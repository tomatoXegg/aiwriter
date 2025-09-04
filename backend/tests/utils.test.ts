import { DatabaseUtils, QueryBuilder } from '../src/database/utils';

describe('Database Utils', () => {
  describe('Validation', () => {
    test('should validate required fields', () => {
      const schema = {
        name: { required: true, type: 'string' },
        email: { required: true, type: 'email' }
      };

      const data = {
        name: 'Test',
        email: 'invalid-email'
      };

      const errors = DatabaseUtils.validate(data, schema);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toContain('valid email address');
    });

    test('should validate string length', () => {
      const schema = {
        name: { required: true, type: 'string', min: 3, max: 10 }
      };

      const data = {
        name: 'ab' // Too short
      };

      const errors = DatabaseUtils.validate(data, schema);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
      expect(errors[0].message).toContain('at least 3 characters');
    });

    test('should validate number ranges', () => {
      const schema = {
        score: { required: true, type: 'number', min: 0, max: 10 }
      };

      const data = {
        score: 15 // Too high
      };

      const errors = DatabaseUtils.validate(data, schema);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('score');
    });

    test('should validate patterns', () => {
      const schema = {
        platform: { required: true, type: 'string', pattern: /^(wechat|weibo)$/ }
      };

      const data = {
        platform: 'invalid'
      };

      const errors = DatabaseUtils.validate(data, schema);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('platform');
    });

    test('should pass validation with valid data', () => {
      const schema = {
        name: { required: true, type: 'string', min: 1, max: 100 },
        email: { required: true, type: 'email' },
        age: { required: true, type: 'number', min: 0, max: 150 }
      };

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const errors = DatabaseUtils.validate(data, schema);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('Sanitization', () => {
    test('should sanitize string values', () => {
      const schema = {
        name: { type: 'string' },
        email: { type: 'string' }
      };

      const data = {
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  '
      };

      const result = DatabaseUtils.sanitize(data, schema);
      
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('JOHN@EXAMPLE.COM');
    });

    test('should convert types', () => {
      const schema = {
        age: { type: 'number' },
        active: { type: 'boolean' },
        settings: { type: 'json' }
      };

      const data = {
        age: '30',
        active: 'true',
        settings: '{"theme": "dark"}'
      };

      const result = DatabaseUtils.sanitize(data, schema);
      
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.settings).toEqual({ theme: 'dark' });
    });
  });

  describe('QueryBuilder', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        all: jest.fn(),
        get: jest.fn()
      };
    });

    test('should build basic select query', () => {
      const builder = QueryBuilder.table('users');
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users');
      expect(params).toEqual([]);
    });

    test('should build query with where conditions', () => {
      const builder = QueryBuilder.table('users')
        .where({ name: 'John', age: 30 });
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users WHERE name = ? AND age = ?');
      expect(params).toEqual(['John', 30]);
    });

    test('should build query with whereIn', () => {
      const builder = QueryBuilder.table('users')
        .whereIn('status', ['active', 'pending']);
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users WHERE status IN (?, ?)');
      expect(params).toEqual(['active', 'pending']);
    });

    test('should build query with whereLike', () => {
      const builder = QueryBuilder.table('users')
        .whereLike({ name: 'John' });
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users WHERE name LIKE ?');
      expect(params).toEqual(['%John%']);
    });

    test('should build query with joins', () => {
      const builder = QueryBuilder.table('users')
        .join('posts', 'users.id = posts.user_id')
        .join('comments', 'posts.id = comments.post_id', 'LEFT');
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON posts.id = comments.post_id');
      expect(params).toEqual([]);
    });

    test('should build query with ordering', () => {
      const builder = QueryBuilder.table('users')
        .orderBy('name', 'ASC');
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users ORDER BY name ASC');
      expect(params).toEqual([]);
    });

    test('should build query with pagination', () => {
      const builder = QueryBuilder.table('users')
        .limit(10)
        .offset(20);
      const { query, params } = builder.build();

      expect(query).toBe('SELECT * FROM users LIMIT ? OFFSET ?');
      expect(params).toEqual([10, 20]);
    });

    test('should build count query', async () => {
      const builder = QueryBuilder.table('users').where({ active: true });
      const count = await builder.count(mockDb);

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM users WHERE active = ?',
        [true]
      );
    });

    test('should build complex query', () => {
      const builder = QueryBuilder.table('users')
        .select(['id', 'name', 'email'])
        .where({ active: true })
        .whereIn('role', ['admin', 'user'])
        .whereLike({ name: 'John' })
        .orderBy('created_at', 'DESC')
        .limit(10);
      
      const { query, params } = builder.build();

      expect(query).toContain('SELECT id, name, email FROM users');
      expect(query).toContain('WHERE active = ?');
      expect(query).toContain('role IN (?, ?)');
      expect(query).toContain('name LIKE ?');
      expect(query).toContain('ORDER BY created_at DESC');
      expect(query).toContain('LIMIT ?');
      
      expect(params).toEqual([
        true,
        'admin',
        'user',
        '%John%',
        10
      ]);
    });
  });

  describe('Utility Functions', () => {
    test('should generate valid UUID', () => {
      const id = DatabaseUtils.generateId();
      
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('should format date correctly', () => {
      const date = new Date('2024-01-01T12:00:00.000Z');
      const formatted = DatabaseUtils.formatDate(date);
      
      expect(formatted).toBe(date.toISOString());
    });

    test('should escape like pattern', () => {
      const pattern = '100%_test\\';
      const escaped = DatabaseUtils.escapeLikePattern(pattern);
      
      expect(escaped).toBe('100\\%\\_test\\\\\\\\');
    });

    test('should build like query', () => {
      const { query, params } = DatabaseUtils.buildLikeQuery('name', 'John');
      
      expect(query).toBe('name LIKE ? ESCAPE \'\\\\\'');
      expect(params).toEqual(['%John%']);
    });
  });

  describe('Text Utilities', () => {
    test('should truncate text', () => {
      const text = 'This is a long text that should be truncated';
      const result = require('../src/database/utils').dbUtils.text.truncate(text, 20);
      
      expect(result).toBe('This is a long tex...');
    });

    test('should slugify text', () => {
      const text = 'Hello World & Test!';
      const result = require('../src/database/utils').dbUtils.text.slugify(text);
      
      expect(result).toBe('hello-world-test');
    });

    test('should extract keywords', () => {
      const text = 'This is a test text about database testing and validation';
      const keywords = require('../src/database/utils').dbUtils.text.extractKeywords(text, 5);
      
      expect(keywords).toHaveLength(5);
      expect(keywords).toContain('test');
      expect(keywords).toContain('database');
    });
  });

  describe('Validation Utilities', () => {
    test('should validate email', () => {
      const utils = require('../src/database/utils').dbUtils.validation;
      
      expect(utils.isValidEmail('test@example.com')).toBe(true);
      expect(utils.isValidEmail('invalid-email')).toBe(false);
    });

    test('should validate URL', () => {
      const utils = require('../src/database/utils').dbUtils.validation;
      
      expect(utils.isValidUrl('https://example.com')).toBe(true);
      expect(utils.isValidUrl('invalid-url')).toBe(false);
    });

    test('should validate JSON', () => {
      const utils = require('../src/database/utils').dbUtils.validation;
      
      expect(utils.isValidJson('{"key": "value"}')).toBe(true);
      expect(utils.isValidJson('invalid-json')).toBe(false);
    });

    test('should sanitize input', () => {
      const utils = require('../src/database/utils').dbUtils.validation;
      
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = utils.sanitizeInput(input);
      
      expect(sanitized).toBe('alert("xss")Hello');
    });
  });
});