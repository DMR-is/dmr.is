import { SubscriberDto } from '../../models/subscriber.model'

export interface ISubscriberService {
  getUserByNationalId(nationalId: string): Promise<SubscriberDto>
}

export const ISubscriberService = Symbol('ISubscriberService')
