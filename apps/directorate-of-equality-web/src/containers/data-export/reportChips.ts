import type {
  ReportCriteria,
  ReportDateRanges,
  ReportGapBounds,
  ReportGapKey,
} from '../../components/data-export/ReportCriteriaCards'
import {
  ADMIN_GENDER_OPTIONS,
  EQUALITY_SOURCE_OPTIONS,
  IMPROVEMENT_PLAN_OPTIONS,
  REPORT_TYPE_OPTIONS,
  type ReportFilterOption,
} from '../../components/data-export/reportExportOptions'
import { dataExportText } from '../../lib/text'
import { DATE_RANGE_LABELS, dateLine, gapLine } from './filterSummary'

export type ReportState = {
  criteria: ReportCriteria
  dates: ReportDateRanges
  gaps: ReportGapBounds
}

/**
 * One removable report-criteria chip.
 *
 * `remove` is a transform rather than a callback so the container can apply
 * the same removal to both the draft and the submitted snapshot.
 */
export type ReportChip = {
  id: string
  label: string
  remove: <S extends ReportState>(state: S) => S
}

// Prefixed where the bare option would not say what it filters: "Karl" or
// "Úr eldra kerfi" alone could be about anything, "Með úrbótaáætlun" cannot.
const CRITERIA: Array<[keyof ReportCriteria, ReportFilterOption[], string?]> = [
  ['type', REPORT_TYPE_OPTIONS],
  ['companyAdminGender', ADMIN_GENDER_OPTIONS, dataExportText.adminGenderLabel],
  [
    'equalitySource',
    EQUALITY_SOURCE_OPTIONS,
    dataExportText.equalitySourceLabel,
  ],
  ['improvementPlan', IMPROVEMENT_PLAN_OPTIONS],
]

const GAP_RANGES: Array<[string, ReportGapKey, ReportGapKey]> = [
  [
    dataExportText.rawGapRange,
    'reportRawGapPercentFrom',
    'reportRawGapPercentTo',
  ],
  [
    dataExportText.oskyrtGapRange,
    'reportOskyrtPercentFrom',
    'reportOskyrtPercentTo',
  ],
]

/**
 * Chips for the report half of the filter, in panel order.
 *
 * A range is one chip, and removing it clears both bounds — half a range is a
 * different question from the one that was asked.
 */
export const buildReportChips = ({
  criteria,
  dates,
  gaps,
}: ReportState): ReportChip[] => [
  ...CRITERIA.flatMap(([key, options, prefix]) =>
    criteria[key].map((value) => {
      const label =
        options.find((option) => option.value === value)?.label ?? value

      return {
        id: `${key}-${value}`,
        label: prefix ? `${prefix}: ${label}` : label,
        remove: <S extends ReportState>(state: S): S => ({
          ...state,
          criteria: {
            ...state.criteria,
            [key]: state.criteria[key].filter((v) => v !== value),
          },
        }),
      }
    }),
  ),
  ...GAP_RANGES.flatMap(([label, fromKey, toKey]) => {
    const text = gapLine(label, gaps[fromKey], gaps[toKey])
    if (!text) return []

    return [
      {
        id: fromKey,
        label: text,
        remove: <S extends ReportState>(state: S): S => ({
          ...state,
          gaps: { ...state.gaps, [fromKey]: undefined, [toKey]: undefined },
        }),
      },
    ]
  }),
  ...DATE_RANGE_LABELS.flatMap(([label, fromKey, toKey]) => {
    const text = dateLine(label, dates[fromKey], dates[toKey])
    if (!text) return []

    return [
      {
        id: fromKey,
        label: text,
        remove: <S extends ReportState>(state: S): S => ({
          ...state,
          dates: { ...state.dates, [fromKey]: undefined, [toKey]: undefined },
        }),
      },
    ]
  }),
]
