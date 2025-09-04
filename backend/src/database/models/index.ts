export * from './types';
export { AccountModel } from './Account';
export { MaterialModel } from './Material';
export { TopicModel } from './Topic';
export { ContentModel } from './Content';
export { ReviewModel } from './Review';
export { ConfigurationModel } from './Configuration';
export { PromptTemplateModel } from './PromptTemplate';

// Model registry for easy access
import Database from '../init';
import { AccountModel } from './Account';
import { MaterialModel } from './Material';
import { TopicModel } from './Topic';
import { ContentModel } from './Content';
import { ReviewModel } from './Review';
import { ConfigurationModel } from './Configuration';
import { PromptTemplateModel } from './PromptTemplate';

export interface Models {
  account: AccountModel;
  material: MaterialModel;
  topic: TopicModel;
  content: ContentModel;
  review: ReviewModel;
  configuration: ConfigurationModel;
  promptTemplate: PromptTemplateModel;
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
  };
}