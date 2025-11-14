export interface IPublishingTaskService {
  publishAdverts(): Promise<void>
}

export const IPublishingTaskService = Symbol('IPublishingTaskService')
