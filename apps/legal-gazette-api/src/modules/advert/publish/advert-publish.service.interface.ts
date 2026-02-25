import { type DMRUser } from '@dmr.is/auth/dmrUser'

export interface IAdvertPublishService {
  publishNextPublication(advertId: string, currentUser: DMRUser): Promise<void>

  publishNextPublications(
    advertIds: string[],
    currentUser?: DMRUser,
  ): Promise<void>
}

export const IAdvertPublishService = Symbol('IAdvertPublishService')
