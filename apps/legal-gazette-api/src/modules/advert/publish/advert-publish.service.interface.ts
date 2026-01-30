export interface IAdvertPublishService {
  publishNextPublication(advertId: string): Promise<void>

  publishNextPublications(advertIds: string[]): Promise<void>
}

export const IAdvertPublishService = Symbol('IAdvertPublishService')
