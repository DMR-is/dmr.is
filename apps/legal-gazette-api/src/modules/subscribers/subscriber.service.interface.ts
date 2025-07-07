import { SubscriberDto } from './dto/subscriber.dto'

export interface ISubscriberService {
  getUserByNationalId(nationalId: string): Promise<SubscriberDto>
}

export const ISubscriberService = Symbol('ISubscriberService')
