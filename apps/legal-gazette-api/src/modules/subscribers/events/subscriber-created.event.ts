import { SubscriberDto } from '../../../models/subscriber.model'

export class SubscriberCreatedEvent {
  subscriber!: SubscriberDto
  /**
   * The nationalId of the actor who initiated the subscription.
   * This may differ from subscriber.nationalId when acting on behalf of
   * a company or another person via delegations.
   */
  actorNationalId!: string
}
