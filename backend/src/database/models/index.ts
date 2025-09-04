export * from './types';
export { AccountModel } from './Account';
export { MaterialModel } from './Material';
export { TopicModel } from './Topic';
export { ContentModel } from './Content';
export { ReviewModel } from './Review';
export { ConfigurationModel } from './Configuration';
export { PromptTemplateModel } from './PromptTemplate';
export { CategoryModel } from './Category';
export { TagModel } from './Tag';
export { ContentGenerationModel } from './ContentGeneration';
export { BatchGenerationModel } from './BatchGeneration';
export { ContentVersionModel } from './ContentVersion';

// Model registry for easy access
import Database from '../init';
import { AccountModel } from './Account';
import { MaterialModel } from './Material';
import { TopicModel } from './Topic';
import { ContentModel } from './Content';
import { ReviewModel } from './Review';
import { ConfigurationModel } from './Configuration';
import { PromptTemplateModel } from './PromptTemplate';
import { CategoryModel } from './Category';
import { TagModel } from './Tag';

export interface Models {
  account: AccountModel;
  material: MaterialModel;
  topic: TopicModel;
  content: ContentModel;
  review: ReviewModel;
  configuration: ConfigurationModel;
  promptTemplate: PromptTemplateModel;
  category: CategoryModel;
  tag: TagModel;
  contentGeneration: ContentGenerationModel;
  batchGeneration: BatchGenerationModel;
  contentVersion: ContentVersionModel;
}

export function createModels(database: Database): Models {
  return {
    account: new AccountModel(database),
    material: new MaterialModel(database),
    topic: new TopicModel(database),
    content: new ContentModel(database),
    review: new ReviewModel(database),
    configuration: new ConfigurationModel(database),
    promptTemplate: new PromptTemplateModel(database),
    category: new CategoryModel(database),
    tag: new TagModel(database),
    contentGeneration: new ContentGenerationModel(database),
    batchGeneration: new BatchGenerationModel(database),
    contentVersion: new ContentVersionModel(database),
  };
}