import { ApiEnum, ApiOptionalString, ApiString } from '@dmr.is/decorators'

import { CompanySectorEnum, CompanyStatusEnum } from '../models/company.enums'

/**
 * RSK company-registry preview backing the create screen — every field we can
 * pre-fill from RSK, shown read-only so the admin sees exactly what will be
 * stored. `postcode` / `isatCategory` are the human-readable forms of the values
 * `create` persists; `statusReason` explains an inactive status; `sector` /
 * `legalFormName` are the classification `create` derives from the same RSK
 * call. Only `employeeCountCategory` is absent — RSK does not carry it, so it
 * is the one field the admin still enters by hand.
 */
export class CompanyRskPreviewDto {
  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string

  @ApiEnum(CompanyStatusEnum, { enumName: 'CompanyStatusEnum' })
  status!: CompanyStatusEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'Reason the company is not active (null when active). Shown on the create screen.',
  })
  statusReason!: string | null

  @ApiOptionalString({ nullable: true })
  address!: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'Resolved postcode, e.g. "105 Reykjavík".',
  })
  postcode!: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'Resolved ÍSAT2008 classification, e.g. "62.01.0 Computer programming".',
  })
  isatCategory!: string | null

  @ApiEnum(CompanySectorEnum, {
    enumName: 'CompanySectorEnum',
    description:
      'Ownership sector derived from the RSK legal form, exactly as `create` will store it. UNKNOWN here means the legal form is one we do not map yet — the create screen is the cheapest place for an admin to notice that, rather than after the row exists.',
  })
  sector!: CompanySectorEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'Raw RSK legal form name (rekstrarform) the sector was derived from, e.g. "Einkahlutafélag". Null when RSK carried no legal form.',
  })
  legalFormName!: string | null
}
