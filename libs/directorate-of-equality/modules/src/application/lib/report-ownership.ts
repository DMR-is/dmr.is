import type { CompanyDto } from '../../company/dto/company.dto'

/**
 * The columns the ownership rule reads off a report's `company_report` rows.
 * Structural so a caller can pass a model row or a plain projection.
 */
export type OwnershipRow = {
  companyId: string
  parentCompanyId: string | null
}

/**
 * The one rule for "may this company open this report" on the applicant
 * routes: the report's parent `company_report` row — the first row without a
 * `parentCompanyId` — names the company.
 *
 * A subsidiary that a group report merely covers does NOT own it: the parent
 * filed it and is the only one that can read, comment on, edit or withdraw it.
 *
 * Shared by every `reports/:providerId` lookup and by the submissions list, so
 * the list can never show a report the detail route then 404s on, or hide one
 * it would open. Change it here or not at all.
 */
export const isReportOwnedBy = (
  rows: readonly OwnershipRow[],
  company: Pick<CompanyDto, 'id'>,
): boolean => {
  const parent = rows.find((row) => row.parentCompanyId === null)

  return parent !== undefined && parent.companyId === company.id
}
