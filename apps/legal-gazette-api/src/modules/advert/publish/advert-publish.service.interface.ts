import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

export interface IAdvertPublishService {
  publishNextPublication(advertId: string, currentUser: DMRUser): Promise<void>

  publishNextPublications(
    advertIds: string[],
    currentUser?: DMRUser,
  ): Promise<void>
}

export const IAdvertPublishService = Symbol('IAdvertPublishService')
