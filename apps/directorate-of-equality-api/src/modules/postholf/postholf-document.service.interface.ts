import { PostholfDocumentDto } from './dto/postholf-document.dto'

export interface IPostholfDocumentService {
  /**
   * Resolves one Skjalaveita request to a document.
   *
   * Throws `BadRequestException` for a malformed kennitala or documentId, and
   * `NotFoundException` when the pair does not correspond to a notice this system
   * actually issued — deliberately the same answer whether the company is unknown,
   * the fingerprint does not match, or no issuance event exists, so the endpoint
   * cannot be used to probe which companies have been served.
   */
  getDocument(
    nationalId: string,
    documentId: string,
    includeDocument: boolean,
  ): Promise<PostholfDocumentDto>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IPostholfDocumentService = Symbol('IPostholfDocumentService')
