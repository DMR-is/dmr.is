/** One document to file under a company's prefix. */
export type CompanyFileUpload = {
  /** Owning company. The prefix is the retrieval path, so this is required. */
  companyNationalId: string
  /** File name as the recipient sees it, e.g. `launagreining-<uuid>.pdf`. */
  filename: string
  content: Buffer
  /** When the document was issued — dates the key. */
  issuedAt: Date
}

export interface ICompanyFileService {
  /**
   * Archives documents issued to a company, under
   * `company-files/{companyNationalId}/{YYYY-MM-DD}-{filename}`.
   *
   * Returns the keys written. An upload that is skipped or fails contributes no
   * key, so an empty array means nothing was archived.
   *
   * ⚠️ **Never throws.** Callers archive *after* the document has already been
   * delivered, so a storage failure must not surface: the company has its copy,
   * and the alternative is failing a decision that is already committed. The
   * consequence is that a missing archive is visible only in the logs — see the
   * note on the implementation.
   */
  archive(uploads: CompanyFileUpload[]): Promise<string[]>
}

export const ICompanyFileService = Symbol('ICompanyFileService')
