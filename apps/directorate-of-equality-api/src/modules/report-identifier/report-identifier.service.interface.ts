export interface IReportIdentifierService {
  /**
   * Mints an identifier no report is using yet — the short pseudonymous handle
   * (`KTPQZW`) reviewers and applicants quote instead of the company's
   * kennitala. Retries past a collision, and throws rather than issuing a
   * duplicate if it cannot find a free code.
   */
  allocate(): Promise<string>
}

export const IReportIdentifierService = Symbol('IReportIdentifierService')
