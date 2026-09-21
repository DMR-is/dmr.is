'use client'

import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { MultiSelectFilter } from '@dmr.is/ui/components/island-is/MultiSelectFilter'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { companiesText, dataExportText } from '../../lib/text'
import { SelectFilter } from '../companies/SelectFilter'
import {
  ADMIN_GENDER_OPTIONS,
  EQUALITY_SOURCE_OPTIONS,
  GAP_BOUND_OPTIONS,
  IMPROVEMENT_PLAN_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from './reportExportOptions'

/**
 * Report criteria, as accordion cards slotted into `CompanyFilter`.
 *
 * ⚠️ These narrow the COMPANY list — they do not change what a row is. A
 * company comes back when at least one of its APPROVED filings satisfies all
 * of them, and it appears once however many of its reports match.
 *
 * Approved-only is why there is no status control here: a draft was never
 * sent, a denied filing was rejected and a withdrawn one was taken back, so
 * none of them is something the Directorate accepted. That leaves exactly one
 * status these can have, and a control offering it would be inert.
 */
export type ReportCriteria = {
  type: string[]
  companyAdminGender: string[]
  equalitySource: string[]
  improvementPlan: string[]
}

export const EMPTY_REPORT_CRITERIA: ReportCriteria = {
  type: [],
  companyAdminGender: [],
  equalitySource: [],
  improvementPlan: [],
}

/** Date ranges on the filing. Pairs rather than lists, hence their own shape. */
export type ReportDateRanges = {
  reportSubmittedFrom?: Date
  reportSubmittedTo?: Date
  reportApprovedFrom?: Date
  reportApprovedTo?: Date
  reportValidUntilFrom?: Date
  reportValidUntilTo?: Date
  reportSalaryDataPeriodFrom?: Date
  reportSalaryDataPeriodTo?: Date
}

export type ReportDateKey = keyof ReportDateRanges

/**
 * The two pay-gap ranges, as strings because they come straight off a select.
 * Parsed to numbers where they become query params.
 */
export type ReportGapBounds = {
  reportRawGapPercentFrom?: string
  reportRawGapPercentTo?: string
  reportOskyrtPercentFrom?: string
  reportOskyrtPercentTo?: string
}

export type ReportGapKey = keyof ReportGapBounds

export const EMPTY_GAP_BOUNDS: ReportGapBounds = {}

type Props = {
  criteria: ReportCriteria
  onCriteriaChange: (key: keyof ReportCriteria, values: string[]) => void
  dates: ReportDateRanges
  onDateChange: (key: ReportDateKey, value: Date | undefined) => void
  gaps: ReportGapBounds
  onGapChange: (key: ReportGapKey, value: string | undefined) => void
}

export const ReportCriteriaCards = ({
  criteria,
  onCriteriaChange,
  dates,
  onDateChange,
  gaps,
  onGapChange,
}: Props) => {
  const labelColor = (...selections: Array<string[] | boolean>) =>
    selections.some((s) => (Array.isArray(s) ? s.length > 0 : s))
      ? 'blue400'
      : 'currentColor'

  const range = (
    label: string,
    fromKey: ReportDateKey,
    toKey: ReportDateKey,
  ) => (
    <Stack space={1}>
      <Text variant="eyebrow">{label}</Text>
      <DatePicker
        name={fromKey}
        label={dataExportText.dateFrom}
        placeholderText={dataExportText.datePlaceholder}
        size="sm"
        locale="is"
        selected={dates[fromKey]}
        handleChange={(date) => onDateChange(fromKey, date ?? undefined)}
        backgroundColor="white"
        required={false}
      />
      <DatePicker
        name={toKey}
        label={dataExportText.dateTo}
        placeholderText={dataExportText.datePlaceholder}
        size="sm"
        locale="is"
        selected={dates[toKey]}
        // The lower bound is the floor: a "to" before the "from" describes an
        // empty range, and the picker refusing it is clearer than an empty
        // result table that looks like a data problem.
        minDate={dates[fromKey]}
        handleChange={(date) => onDateChange(toKey, date ?? undefined)}
        backgroundColor="white"
        required={false}
      />
    </Stack>
  )

  /**
   * One gap's bounds. Both selects share the same 0,5-step option list; the
   * upper one is floored at the lower so an impossible range cannot be built.
   */
  const gapRange = (
    label: string,
    fromKey: ReportGapKey,
    toKey: ReportGapKey,
  ) => {
    const from = gaps[fromKey]
    const upperOptions = from
      ? GAP_BOUND_OPTIONS.filter(
          (option) => Number(option.value) >= Number(from),
        )
      : GAP_BOUND_OPTIONS

    return (
      <Stack space={1}>
        <Text variant="eyebrow">{label}</Text>
        <SelectFilter
          name={fromKey}
          label={dataExportText.gapFrom}
          placeholder={dataExportText.gapPlaceholder}
          noOptionsMessage={companiesText.filterNoResults}
          options={GAP_BOUND_OPTIONS}
          selected={from ? [from] : []}
          isMulti={false}
          onChange={(val) => onGapChange(fromKey, val[0])}
        />
        <SelectFilter
          name={toKey}
          label={dataExportText.gapTo}
          placeholder={dataExportText.gapNoUpperBound}
          noOptionsMessage={companiesText.filterNoResults}
          options={upperOptions}
          selected={gaps[toKey] ? [gaps[toKey] as string] : []}
          isMulti={false}
          onChange={(val) => onGapChange(toKey, val[0])}
        />
      </Stack>
    )
  }

  return (
    <>
      <AccordionItem
        id="reportCriteria"
        label={dataExportText.cardReport}
        labelUse="h5"
        labelVariant="h5"
        labelColor={labelColor(
          criteria.type,
          criteria.companyAdminGender,
          criteria.equalitySource,
          criteria.improvementPlan,
        )}
        iconVariant="small"
      >
        <Stack space={2}>
          <MultiSelectFilter
            name="reportType"
            label={dataExportText.typeLabel}
            placeholder={dataExportText.typePlaceholder}
            noOptionsMessage={companiesText.filterNoResults}
            isSearchable={false}
            options={REPORT_TYPE_OPTIONS}
            selected={criteria.type}
            onChange={(val) => onCriteriaChange('type', val)}
          />
          <MultiSelectFilter
            name="reportCompanyAdminGender"
            label={dataExportText.adminGenderLabel}
            placeholder={dataExportText.adminGenderPlaceholder}
            noOptionsMessage={companiesText.filterNoResults}
            isSearchable={false}
            options={ADMIN_GENDER_OPTIONS}
            selected={criteria.companyAdminGender}
            onChange={(val) => onCriteriaChange('companyAdminGender', val)}
          />
          <MultiSelectFilter
            name="reportEqualitySource"
            label={dataExportText.equalitySourceLabel}
            placeholder={dataExportText.equalitySourcePlaceholder}
            noOptionsMessage={companiesText.filterNoResults}
            isSearchable={false}
            options={EQUALITY_SOURCE_OPTIONS}
            selected={criteria.equalitySource}
            onChange={(val) => onCriteriaChange('equalitySource', val)}
          />
          <MultiSelectFilter
            name="reportImprovementPlan"
            label={dataExportText.improvementPlanLabel}
            placeholder={dataExportText.improvementPlanPlaceholder}
            noOptionsMessage={companiesText.filterNoResults}
            isSearchable={false}
            options={IMPROVEMENT_PLAN_OPTIONS}
            selected={criteria.improvementPlan}
            onChange={(val) => onCriteriaChange('improvementPlan', val)}
          />
        </Stack>
      </AccordionItem>

      <AccordionItem
        id="reportGap"
        label={dataExportText.cardGap}
        labelUse="h5"
        labelVariant="h5"
        labelColor={labelColor(
          Object.values(gaps).some((value) => value !== undefined),
        )}
        iconVariant="small"
      >
        <Stack space={3}>
          {gapRange(
            dataExportText.rawGapRange,
            'reportRawGapPercentFrom',
            'reportRawGapPercentTo',
          )}
          {gapRange(
            dataExportText.oskyrtGapRange,
            'reportOskyrtPercentFrom',
            'reportOskyrtPercentTo',
          )}
        </Stack>
      </AccordionItem>

      <AccordionItem
        id="reportDates"
        label={dataExportText.cardDates}
        labelUse="h5"
        labelVariant="h5"
        labelColor={labelColor(
          Object.values(dates).some((value) => value !== undefined),
        )}
        iconVariant="small"
      >
        <Stack space={3}>
          {range(
            dataExportText.createdRange,
            'reportSubmittedFrom',
            'reportSubmittedTo',
          )}
          {range(
            dataExportText.approvedRange,
            'reportApprovedFrom',
            'reportApprovedTo',
          )}
          {range(
            dataExportText.validUntilRange,
            'reportValidUntilFrom',
            'reportValidUntilTo',
          )}
          {range(
            dataExportText.salaryPeriodRange,
            'reportSalaryDataPeriodFrom',
            'reportSalaryDataPeriodTo',
          )}
        </Stack>
      </AccordionItem>
    </>
  )
}
