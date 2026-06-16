/**
 * Events sent to the island.is application system to drive its application
 * state machine when a DoE report's review concludes.
 */
export enum ApplicationSystemEvent {
  APPROVE = 'APPROVE',
  DENY = 'DENY',
  EDIT = 'EDIT',
}

export interface IApplicationSystemService {
  /**
   * Notify the island.is application system that the DoE report tied to the
   * given application has been approved.
   *
   * @param applicationId island.is application UUID (report `providerId`)
   */
  notifyApproved(applicationId: string): Promise<void>

  /**
   * Notify the island.is application system that the DoE report tied to the
   * given application has been denied.
   *
   * @param applicationId island.is application UUID (report `providerId`)
   */
  notifyDenied(applicationId: string): Promise<void>

  /**
   * Notify the island.is application system that the DoE report tied to the
   * given application has been edited.
   *
   * @param applicationId island.is application UUID (report `providerId`)
   */
  notifyEdited(applicationId: string): Promise<void>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IApplicationSystemService = Symbol('IApplicationSystemService')
