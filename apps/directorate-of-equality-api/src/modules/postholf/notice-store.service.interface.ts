export interface INoticeStoreService {
  /** Stores a rendered notice under the key derived from its documentId. */
  put(nationalId: string, documentId: string, pdf: Buffer): Promise<void>

  /**
   * Reads a stored notice back. Returns `null` when the object is absent, so the
   * callback can answer 404 rather than 500 — an absent object means the notice
   * was never stored, which is a routing/authorisation answer, not a fault.
   */
  get(nationalId: string, documentId: string): Promise<Buffer | null>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const INoticeStoreService = Symbol('INoticeStoreService')
