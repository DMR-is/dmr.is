import {
  ApiDateTime,
  ApiOptionalBoolean,
  ApiOptionalDateTime,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

/**
 * One archived row of the Directorate's retired SharePoint register, as shown
 * on the company detail view's legacy tab.
 *
 * Every field but the identifiers is optional and nullable, because the source
 * was a hand-kept working sheet: no column was mandatory and most are blank on
 * most rows. Read `LegacyReportModel` for why the legacy values stay as the
 * sheet's own Icelandic strings rather than becoming enums.
 */
export class LegacyReportDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  companyId!: string

  /**
   * ⚠️ `ApiString`, not `ApiNationalId`. That decorator normalises to and
   * validates 10 digits, and this is the sheet's raw cell: 13 rows fail
   * checksum validation and two are truncated to 9 digits. Validating the
   * archive would reject the very rows it exists to preserve.
   */
  @ApiString({
    description:
      'Kennitala exactly as the legacy list held it — unvalidated and possibly malformed. The resolved company is `companyId`.',
  })
  nationalId!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Staða — the legacy workflow state: "ólokið", "Lokið", "undanþága", "hætt" or "í vinnslu".',
  })
  legacyStatus!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Í gildi — "Í gildi" or "Útrunnið". Blank where the list never recorded one, which in practice means never certified.',
  })
  validity!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Breyting — what changed about the row since the previous list ("Nýtt", "Dottið út", "Nafn", "Stærðarflokkun"). Multi-valued, joined with ";#".',
  })
  changeType!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Jafnlaunavottun/staðfesting — "Vottun" (accredited body) or "Staðfesting" (confirmed by the Directorate).',
  })
  certificationType!: string | null

  @ApiOptionalString({
    nullable: true,
    format: 'date',
    example: '2024-03-26',
    description:
      'Dags. Staðf/Vottunar — when the certification was issued, as `YYYY-MM-DD`.',
  })
  certifiedAt!: string | null

  @ApiOptionalString({
    nullable: true,
    format: 'date',
    example: '2027-12-20',
    description:
      'Gildistími vottunar/staðfestingar — the certificate’s stated expiry, as `YYYY-MM-DD`. Not the live deadline: that is `company.nextSalaryReportDueAt`.',
  })
  salaryValidUntil!: string | null

  @ApiOptionalString({
    nullable: true,
    format: 'date',
    example: '2027-05-31',
    description:
      'Gildistíma jafnréttisáætlunar — when the equality plan lapses, as `YYYY-MM-DD`.',
  })
  equalityValidUntil!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Númer hrings — which certification round the company was on ("1." … "4.").',
  })
  round!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Málsnúmer — the Directorate’s case number for the salary certification.',
  })
  caseNumber!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Jafnréttisáætlun - málsnúmer. A separate case from the salary one; some rows hold prose ("vantar", "svf.") instead of a number.',
  })
  equalityCaseNumber!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Vottunaraðili — the accrediting body, with SharePoint’s lookup-id suffix stripped.',
  })
  certifier!: string | null

  @ApiOptionalNumber({
    nullable: true,
    description: 'Fjöldi kk — male headcount as counted for the certification.',
  })
  maleCount!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Fjöldi kvk — female headcount as counted for the certification.',
  })
  femaleCount!: number | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Hlutlaus skráning kyns — employees registered with a neutral gender.',
  })
  neutralCount!: number | null

  @ApiOptionalString({
    nullable: true,
    description: 'Kyn æðsta stjórnanda — "Karl" or "Kona".',
  })
  topManagerGender!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Kynb. launamunur. A string, not a number: the few populated rows mix a percentage with what appear to be ISK amounts.',
  })
  genderPayGap!: string | null

  @ApiOptionalNumber({
    nullable: true,
    description:
      'Starfsmannafjöldi — informational only, and often at odds with the size buckets. `company.employeeCountCategory` comes from `sizeCategoryNew`.',
  })
  employeeCount!: number | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Nýr stærðarflokkur — the authoritative bucket ("0", "25-49", "50+"), and what the company’s size was mapped from.',
  })
  sizeCategoryNew!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Stærðarflokkur — the older, finer bucketing ("50-89", "90-149", ">249"). Used as fallback where the new bucket is blank.',
  })
  sizeCategoryOld!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Tengiliður — the named contact. The company record keeps only the email address.',
  })
  contactName!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Tekjuár — the year the figures were drawn from. A string: some rows say "0".',
  })
  incomeYear!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Breytingar / Áður flokkað — the admins’ free-text notes. Also seeded onto the company timeline as a system comment.',
  })
  notes!: string | null

  @ApiOptionalBoolean({
    nullable: true,
    description:
      'Whether the legacy list had already sent its 6-month reminder. Not read by the reminder task here.',
  })
  reminderSent6Months!: boolean | null

  @ApiOptionalBoolean({
    nullable: true,
    description:
      'Whether the legacy list had already sent its 2-week reminder. Not read by the reminder task here.',
  })
  reminderSent2Weeks!: boolean | null

  @ApiOptionalDateTime({
    nullable: true,
    description: 'When the row was created in SharePoint.',
  })
  legacyCreatedAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'When the row was last edited in SharePoint. This is what resolves duplicate kennitölur — the latest edit wins.',
  })
  legacyModifiedAt!: Date | null

  @ApiDateTime({
    description: 'When this archive row was loaded into our register.',
  })
  createdAt!: Date
}
