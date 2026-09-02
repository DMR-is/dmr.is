import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import type { LegacyReportDto } from '../dto/legacy-report.dto'
import { CompanyModel } from './company.model'

/**
 * One row of the Directorate's outgoing SharePoint register — the list at
 * `sites/gagnasafnjafnrttisstofu-jafnt/Lists/Jafnlaunavottun`, kept by hand as
 * a working sheet ("Adda eftirlit Gagnasafn") and retired when this system took
 * over the register.
 *
 * ## Why an archive table rather than real reports
 *
 * The sheet records certifications this system never saw: at hand-over, 623 of
 * its 1 759 rows were certified and in force. Turning those into `report` +
 * `company_report` rows would mean minting APPROVED reports for submissions
 * that never went through the flow — no employees, no criteria, no result — and
 * every derived thing that reads `report` (the renewal window, the salary
 * report's `equalityReportId` reference, the public register) would then answer
 * from a fiction.
 *
 * So the legacy record stays legacy: no `report` row is ever minted from it.
 *
 * ## What derives from it: the admin register's two coverage questions
 *
 * `companyReportStatusCaseSql` reads the two expiry dates here as a second way
 * to be covered, beside an APPROVED `report`. It has to. The load leaves 1 507
 * of 1 753 companies at 25+ with no `report` row, so without that branch the
 * whole register read MISSING_EQUALITY_REPORT on day one — including the ~540
 * companies whose equality plan this very table records as in force. "Has not
 * filed here" and "is out of compliance" are different claims, and the admin
 * register is asking the second.
 *
 * `buildCompanyExpiryWhere` reads them too, through
 * `legacyCertificationExpiringSql`, and necessarily: once a legacy certificate
 * counts as coverage, an expiry queue that looked only at `report` would hide
 * every one of those 1 507 companies until the day it lapsed. The two answer
 * "is this company covered" and "for how much longer", off the same two
 * columns, and drift between them is what `report-status.ts` exists to prevent.
 *
 * Nothing else derives from this table, and in particular the application
 * portal's own gate does not: `getSalaryReportEligibility` still requires a
 * real `report`, because the salary report references its equality report by
 * id and a legacy certificate has none to give. See the note on `reportCovered`
 * in `report-status.ts` for why that divergence is the intended one.
 *
 * ## Everything is TEXT, and deliberately so
 *
 * `legacyStatus`, `validity`, `changeType` and `certificationType` hold the
 * sheet's own Icelandic strings ("ólokið", "Útrunnið", "Nafn;#Stærðarflokkun")
 * verbatim, not enums. This table's contract is *what the list said*, not what
 * our domain means:
 *
 *   - `changeType` is multi-valued — SharePoint joins choices with `;#`.
 *   - `legacyStatus` gained "í vinnslu" between two exports of the same sheet.
 *   - `genderPayGap` mixes units across its 8 populated rows ("1,6", "396").
 *
 * A Postgres enum would turn the next re-export into a migration, and the
 * mapping into our own vocabulary already happens on `company` (status,
 * `employeeCountCategory`, `sector`, the two due dates). Duplicating it here
 * would give us two answers to the same question.
 *
 * ## `nationalId` is kept raw beside the FK
 *
 * The FK answers "which company is this", the string answers "what did the
 * sheet claim". Those differ: 13 source rows carry a national ID that fails
 * checksum validation (legacy institutional `71026x` IDs, plus two truncated to
 * 9 digits), and 7 kennitölur appear twice. The load resolves those to one
 * `company` row each; this column preserves what it resolved *from*.
 *
 * ## No unique constraint on `companyId`
 *
 * One row per *sheet* row, not per company. Where two sheet rows collapse to
 * one company — a renamed ministry, a kennitala shared by two police districts
 * — both are archived, because dropping one would lose the certification it
 * carried. The company tab renders however many rows exist.
 *
 * Consequently there is no natural upsert key (two rows can be byte-identical
 * including `legacyModifiedAt`), so the register load replaces the table
 * wholesale — `DELETE FROM legacy_report` then insert — rather than upserting.
 * That is safe precisely because nothing else writes here.
 */
type LegacyReportAttributes = {
  companyId: string
  nationalId: string
  legacyStatus: string | null
  validity: string | null
  changeType: string | null
  certificationType: string | null
  certifiedAt: string | null
  salaryValidUntil: string | null
  equalityValidUntil: string | null
  round: string | null
  caseNumber: string | null
  equalityCaseNumber: string | null
  certifier: string | null
  maleCount: number | null
  femaleCount: number | null
  neutralCount: number | null
  topManagerGender: string | null
  genderPayGap: string | null
  employeeCount: number | null
  sizeCategoryNew: string | null
  sizeCategoryOld: string | null
  contactName: string | null
  incomeYear: string | null
  notes: string | null
  reminderSent6Months: boolean | null
  reminderSent2Weeks: boolean | null
  legacyCreatedAt: Date | null
  legacyModifiedAt: Date | null
}

type LegacyReportCreateAttributes = {
  companyId: string
  nationalId: string
  legacyStatus?: string | null
  validity?: string | null
  changeType?: string | null
  certificationType?: string | null
  certifiedAt?: string | null
  salaryValidUntil?: string | null
  equalityValidUntil?: string | null
  round?: string | null
  caseNumber?: string | null
  equalityCaseNumber?: string | null
  certifier?: string | null
  maleCount?: number | null
  femaleCount?: number | null
  neutralCount?: number | null
  topManagerGender?: string | null
  genderPayGap?: string | null
  employeeCount?: number | null
  sizeCategoryNew?: string | null
  sizeCategoryOld?: string | null
  contactName?: string | null
  incomeYear?: string | null
  notes?: string | null
  reminderSent6Months?: boolean | null
  reminderSent2Weeks?: boolean | null
  legacyCreatedAt?: Date | null
  legacyModifiedAt?: Date | null
}

@MutableTable({ tableName: DoeModels.LEGACY_REPORT })
export class LegacyReportModel extends MutableModel<
  LegacyReportAttributes,
  LegacyReportCreateAttributes
> {
  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  // The sheet's own Kennitala cell, unresolved. See the header note.
  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  // Staða — "ólokið" | "Lokið" | "undanþága" | "hætt" | "í vinnslu".
  @Column({ type: DataType.TEXT, allowNull: true, field: 'legacy_status' })
  legacyStatus!: string | null

  // Í gildi — "Í gildi" | "Útrunnið", or blank where the list never said.
  @Column({ type: DataType.TEXT, allowNull: true })
  validity!: string | null

  // Breyting — what changed about the row since the previous list. Multi-valued
  // ("Nafn;#Stærðarflokkun").
  @Column({ type: DataType.TEXT, allowNull: true, field: 'change_type' })
  changeType!: string | null

  // Jafnlaunavottun/staðfesting — "Vottun" (certified by an accredited body) or
  // "Staðfesting" (confirmed by the Directorate itself).
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'certification_type',
  })
  certificationType!: string | null

  /**
   * The three dates are DATEONLY (`YYYY-MM-DD`), matching the sheet's day cells
   * and `report_outlier_group.remedy_date`. They are calendar dates, not
   * instants — do not parse them as such (see `report-pdf/lib/format.ts`).
   *
   * ⚠️ `salaryValidUntil` is NOT the same thing as
   * `company.next_salary_report_due_at`, even though the load derives one from
   * the other. This is the certificate's stated expiry as the old list recorded
   * it; that is a live regulatory deadline the approval flow advances. They
   * diverge from the first approval onwards, and for the 20 rows whose
   * certificate was surrendered early they never agreed at all.
   */
  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'certified_at' })
  certifiedAt!: string | null

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'salary_valid_until',
  })
  salaryValidUntil!: string | null

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'equality_valid_until',
  })
  equalityValidUntil!: string | null

  // Númer hrings — which certification round the company is on ("1." … "4.").
  @Column({ type: DataType.TEXT, allowNull: true })
  round!: string | null

  // Málsnúmer — the Directorate's case number for the salary certification.
  @Column({ type: DataType.TEXT, allowNull: true, field: 'case_number' })
  caseNumber!: string | null

  // Jafnréttisáætlun - málsnúmer. A separate case, hence a separate number;
  // some rows hold prose ("vantar", "svf.") rather than a number.
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'equality_case_number',
  })
  equalityCaseNumber!: string | null

  // Vottunaraðili — the accrediting body, with SharePoint's lookup-id suffix
  // stripped by the load ("BSI á Íslandi;#4" → "BSI á Íslandi").
  @Column({ type: DataType.TEXT, allowNull: true })
  certifier!: string | null

  // Fjöldi kk / Fjöldi kvk / Hlutlaus skráning kyns, as counted for the
  // certification. Headcounts on `report` come from a submission instead.
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'male_count' })
  maleCount!: number | null

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'female_count' })
  femaleCount!: number | null

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'neutral_count' })
  neutralCount!: number | null

  // Kyn æðsta stjórnanda — "Karl" | "Kona", and one row holding both.
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'top_manager_gender',
  })
  topManagerGender!: string | null

  // Kynb. launamunur. TEXT, not numeric: the 8 populated rows mix a percentage
  // ("1,6") with what look like ISK amounts ("396", "468"), and the archive has
  // no business deciding which was meant.
  @Column({ type: DataType.TEXT, allowNull: true, field: 'gender_pay_gap' })
  genderPayGap!: string | null

  /**
   * Starfsmannafjöldi. Informational only, and frequently at odds with the size
   * buckets beside it — 64 rows bucketed "50+" hold fewer than 50, and 34 rows
   * bucketed "0" hold more than 24 (one holds 546). The bucket is what the
   * Directorate acted on, so `company.employee_count_category` comes from
   * `sizeCategoryNew`, never from this number.
   */
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'employee_count' })
  employeeCount!: number | null

  // Nýr stærðarflokkur ("0" | "25-49" | "50+") — the authoritative bucket, and
  // what `company.employee_count_category` is mapped from.
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'size_category_new',
  })
  sizeCategoryNew!: string | null

  // Stærðarflokkur — the older, finer bucketing ("50-89", "90-149", ">249").
  // Kept because it is the fallback when the new column is blank (243 rows), and
  // because the two disagree on 94 rows where both are filled.
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'size_category_old',
  })
  sizeCategoryOld!: string | null

  // Tengiliður — the named contact. `company` holds only the email; this is the
  // only place the person's name survives.
  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_name' })
  contactName!: string | null

  // Tekjuár — the year the headcount and pay figures were drawn from. TEXT: 55
  // rows say "0" and one is blank.
  @Column({ type: DataType.TEXT, allowNull: true, field: 'income_year' })
  incomeYear!: string | null

  /**
   * Breytingar / Áður flokkað — the admins' free-text notes: former names and
   * mergers, Skatturinn-list history, surrendered certificates, and bare
   * previous size labels (the "Áður flokkað" half).
   *
   * Also seeded onto the company as a system `company_comment`, so an admin
   * meets the note on the timeline without opening this tab. Kept here as well
   * because the comment is editable and deletable and this is the archive.
   */
  @Column({ type: DataType.TEXT, allowNull: true })
  notes!: string | null

  /**
   * The old list's own reminder bookkeeping — whether it had already chased the
   * company at the 6-month and 2-week marks.
   *
   * ⚠️ Not read by the report-deadline-reminder task, which dedupes on
   * `company_event` rows instead. These are the only record that a company was
   * already chased under the old regime, so if that history ever needs to
   * suppress a first reminder here, this is where it would be read from.
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    field: 'reminder_sent_6_months',
  })
  reminderSent6Months!: boolean | null

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    field: 'reminder_sent_2_weeks',
  })
  reminderSent2Weeks!: boolean | null

  // SharePoint's Created/Modified. Distinct from the base class's own
  // `createdAt`/`updatedAt`, which record when *this* row was loaded.
  // `legacyModifiedAt` is what resolves duplicate kennitölur — latest wins.
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'legacy_created_at',
  })
  legacyCreatedAt!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'legacy_modified_at',
  })
  legacyModifiedAt!: Date | null

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel

  static fromModel(model: LegacyReportModel): LegacyReportDto {
    return {
      id: model.id,
      companyId: model.companyId,
      nationalId: model.nationalId,
      legacyStatus: model.legacyStatus,
      validity: model.validity,
      changeType: model.changeType,
      certificationType: model.certificationType,
      certifiedAt: model.certifiedAt,
      salaryValidUntil: model.salaryValidUntil,
      equalityValidUntil: model.equalityValidUntil,
      round: model.round,
      caseNumber: model.caseNumber,
      equalityCaseNumber: model.equalityCaseNumber,
      certifier: model.certifier,
      maleCount: model.maleCount,
      femaleCount: model.femaleCount,
      neutralCount: model.neutralCount,
      topManagerGender: model.topManagerGender,
      genderPayGap: model.genderPayGap,
      employeeCount: model.employeeCount,
      sizeCategoryNew: model.sizeCategoryNew,
      sizeCategoryOld: model.sizeCategoryOld,
      contactName: model.contactName,
      incomeYear: model.incomeYear,
      notes: model.notes,
      reminderSent6Months: model.reminderSent6Months,
      reminderSent2Weeks: model.reminderSent2Weeks,
      legacyCreatedAt: model.legacyCreatedAt,
      legacyModifiedAt: model.legacyModifiedAt,
      createdAt: model.createdAt,
    }
  }

  fromModel(): LegacyReportDto {
    return LegacyReportModel.fromModel(this)
  }
}
