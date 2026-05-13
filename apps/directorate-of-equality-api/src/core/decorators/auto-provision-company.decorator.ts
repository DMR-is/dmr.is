import { SetMetadata } from '@nestjs/common'

export const AUTO_PROVISION_COMPANY_METADATA = 'autoProvisionCompany'

/**
 * Marks a route handler so `CompanyResourceGuard` will create the company
 * row (with `averageEmployeeCountFromRsk: 0`) when the authenticated
 * national ID has no existing company. Without this, the guard rejects
 * unknown companies with NotFoundException.
 */
export const AutoProvisionCompany = (): MethodDecorator =>
  SetMetadata(AUTO_PROVISION_COMPANY_METADATA, true)
