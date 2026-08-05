import type { LegalEntityDto } from './dto/legal-entity.dto'

export type RskLanguage = 'is' | 'en'

export interface IRskCompanyRegistryService {
  /**
   * Retrieve detailed legal entity information by its registration number (kennitala).
   * GET /{nationalId}
   */
  getLegalEntityByNationalId(
    nationalId: string,
    language?: RskLanguage,
  ): Promise<LegalEntityDto>

  /**
   * Retrieve the legal entity overview as a PDF document.
   * GET /{nationalId}/overview
   */
  getLegalEntityOverview(
    nationalId: string,
    language?: RskLanguage,
  ): Promise<Buffer>
}
export const IRskCompanyRegistryService = 'IRskCompanyRegistryService'
