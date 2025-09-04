export * from './SeedManager';
export * from './cli';

// Predefined seed data sets
export const predefinedSeeds = {
  development: {
    name: 'Development Data',
    description: 'Sample data for development and testing',
    version: '2025-09-04',
    data: {
      configurations: [
        { key: 'ai_model', value: 'gemini-pro', type: 'string', description: 'Default AI model' },
        { key: 'max_tokens', value: 2048, type: 'integer', description: 'Maximum tokens for AI generation' },
        { key: 'temperature', value: 0.7, type: 'float', description: 'AI generation temperature' },
        { key: 'default_word_count', value: 1500, type: 'integer', description: 'Default article word count' },
        { key: 'auto_save', value: true, type: 'boolean', description: 'Enable auto-save feature' },
        { key: 'auto_review', value: false, type: 'boolean', description: 'Enable auto-review feature' }
      ],
      promptTemplates: [
        { name: '默认选题生成', type: 'topic', template: '基于以下素材，为我生成5个适合公众号文章的选题建议。每个选题应该包含标题和简要描述。\n\n素材：{material}', is_default: true },
        { name: '默认内容生成', type: 'content', template: '请根据以下选题写一篇完整的公众号文章。文章要求结构清晰，内容丰富，语言流畅。\n\n选题：{topic}\n\n要求：\n1. 字数约{wordCount}字\n2. 风格：{style}\n3. 包含吸引人的标题和完整的正文', is_default: true },
        { name: '默认内容审查', type: 'review', template: '请对以下文章进行质量审查，重点关注：\n1. 语法和拼写错误\n2. 逻辑结构是否清晰\n3. 内容是否原创\n4. 是否符合公众号文章标准\n\n文章内容：{content}', is_default: true }
      ]
    }
  },
  
  minimal: {
    name: 'Minimal Data',
    description: 'Minimal essential data for basic functionality',
    version: '2025-09-04',
    data: {
      configurations: [
        { key: 'ai_model', value: 'gemini-pro', type: 'string', description: 'Default AI model' },
        { key: 'max_tokens', value: 2048, type: 'integer', description: 'Maximum tokens for AI generation' },
        { key: 'temperature', value: 0.7, type: 'float', description: 'AI generation temperature' }
      ],
      promptTemplates: [
        { name: '默认选题生成', type: 'topic', template: '基于素材生成选题：{material}', is_default: true },
        { name: '默认内容生成', type: 'content', template: '根据选题生成内容：{topic}', is_default: true },
        { name: '默认内容审查', type: 'review', template: '审查文章内容：{content}', is_default: true }
      ]
    }
  }
};

// Utility functions for common seeding scenarios
export const seedUtils = {
  // Generate test accounts
  generateTestAccounts(count: number = 3) {
    return Array.from({ length: count }, (_, i) => ({
      name: `测试账号 ${i + 1}`,
      description: `这是第${i + 1}个测试账号`,
      platform: 'wechat' as const
    }));
  },

  // Generate test materials
  generateTestMaterials(count: number = 5) {
    const topics = ['技术', '生活', '商业', '教育', '健康'];
    return Array.from({ length: count }, (_, i) => ({
      title: `测试素材 ${topics[i % topics.length]} ${i + 1}`,
      content: `这是第${i + 1}个测试素材的内容，关于${topics[i % topics.length]}主题。`,
      tags: [topics[i % topics.length], '测试'],
      type: 'text' as const
    }));
  },

  // Generate test topics
  generateTestTopics(count: number = 10) {
    return Array.from({ length: count }, (_, i) => ({
      title: `测试选题 ${i + 1}`,
      description: `这是第${i + 1}个测试选题的描述`,
      prompt: `基于素材生成第${i + 1}个选题`
    }));
  },

  // Generate test configurations
  generateTestConfigurations() {
    return [
      { key: 'test_mode', value: true, type: 'boolean', description: 'Test mode enabled' },
      { key: 'debug_level', value: 'verbose', type: 'string', description: 'Debug logging level' },
      { key: 'cache_ttl', value: 3600, type: 'integer', description: 'Cache time-to-live' },
      { key: 'retry_attempts', value: 3, type: 'integer', description: 'Number of retry attempts' }
    ];
  }
};