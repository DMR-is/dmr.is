import type { ReportCriteria } from '../../components/data-export/ReportCriteriaCards'
import {
  ADMIN_GENDER_OPTIONS,
  EQUALITY_SOURCE_OPTIONS,
  IMPROVEMENT_PLAN_OPTIONS,
  REPORT_TYPE_OPTIONS,
  type ReportFilterOption,
} from '../../components/data-export/reportExportOptions'
import { dataExportText } from '../../lib/text'
import {
  DATE_RANGE_LABELS,
  dateLine,
  GAP_RANGES,
  gapLine,
  type Submission,
} from './filterSummary'

export type ReportState = Pick<Submission, 'criteria' | 'dates' | 'gaps'>

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
// A `Record` so a new criterion without a chip is a type error. Key order is
// insertion order, which is the panel order the chips follow.
const CRITERIA: Record<
  keyof ReportCriteria,
  { options: ReportFilterOption[]; prefix?: string }
> = {
  type: { options: REPORT_TYPE_OPTIONS },
  companyAdminGender: {
    options: ADMIN_GENDER_OPTIONS,
    prefix: dataExportText.adminGenderLabel,
  },
  equalitySource: {
    options: EQUALITY_SOURCE_OPTIONS,
    prefix: dataExportText.equalitySourceLabel,
  },
  improvementPlan: { options: IMPROVEMENT_PLAN_OPTIONS },
}

const sameDay = (a: Date | undefined, b: Date | undefined) =>
  a?.getTime() === b?.getTime()

/**
 * Chips for the report half of the filter, in panel order.
 *
 * A range is one chip, and removing it clears both bounds — half a range is a
 * different question from the one that was asked. It clears them only while
 * they still hold the chip's values, so a range edited in the panel since the
 * last submit survives the chip's removal from the draft.
 */
export const buildReportChips = ({
  criteria,
  dates,
  gaps,
}: ReportState): ReportChip[] => [
  ...(
    Object.entries(CRITERIA) as Array<
      [keyof ReportCriteria, (typeof CRITERIA)[keyof ReportCriteria]]
    >
  ).flatMap(([key, { options, prefix }]) =>
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
        remove: <S extends ReportState>(state: S): S =>
          state.gaps[fromKey] === gaps[fromKey] &&
          state.gaps[toKey] === gaps[toKey]
            ? {
                ...state,
                gaps: {
                  ...state.gaps,
                  [fromKey]: undefined,
                  [toKey]: undefined,
                },
              }
            : state,
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
        remove: <S extends ReportState>(state: S): S =>
          sameDay(state.dates[fromKey], dates[fromKey]) &&
          sameDay(state.dates[toKey], dates[toKey])
            ? {
                ...state,
                dates: {
                  ...state.dates,
                  [fromKey]: undefined,
                  [toKey]: undefined,
                },
              }
            : state,
      },
    ]
  }),
]
