'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMobile } from '../../../hooks/useIsMobile'
import { useIsTablet } from '../../../hooks/useIsTablet'
import { overviewText, sharedText } from '../../../lib/text'
import * as styles from './ReportFilter.css'

export type FilterOption = { value: string; label: string }

// UI-only virtual filter value — never sent to the API
const IMPROVEMENT_PLAN_VALUE = 'IMPROVEMENT_PLAN'

type Props = {
  q: string | null
  type: string[] | null
  status: string[] | null
  statusOptions?: FilterOption[]
  reviewerUserId: string[] | null
  reviewers?: FilterOption[]
  hasImprovementPlan: boolean | null
  dateFrom: Date | undefined
  dateTo: Date | undefined
  onQChange: (value: string | null) => void
  onTypeChange: (values: string[] | null) => void
  onStatusChange: (values: string[] | null) => void
  onReviewerChange: (values: string[] | null) => void
  onHasImprovementPlanChange: (value: boolean | null) => void
  onDateFromChange: (date: Date | undefined) => void
  onDateToChange: (date: Date | undefined) => void
  onReset: () => void
  showDelayed?: boolean
  onShowDelayedChange?: (value: boolean) => void
}

export const ReportFilter = ({
  q,
  type,
  status,
  statusOptions,
  reviewerUserId,
  reviewers,
  hasImprovementPlan,
  dateFrom,
  dateTo,
  onQChange,
  onTypeChange,
  onStatusChange,
  onReviewerChange,
  onHasImprovementPlanChange,
  onDateFromChange,
  onDateToChange,
  onReset,
  showDelayed,
  onShowDelayedChange,
}: Props) => {
  const { isMobile } = useIsMobile()
  const { isTablet } = useIsTablet()

  const handleReset = () => {
    onDateFromChange(undefined)
    onDateToChange(undefined)
    onStatusChange(null)
    onTypeChange(null)
    onReviewerChange(null)
    onHasImprovementPlanChange(null)
    onQChange(null)
    if (onShowDelayedChange) onShowDelayedChange(false)
    onReset()
  }

  const extraCategories = [
    ...(statusOptions && statusOptions.length > 0
      ? [
          {
            id: 'status',
            label: sharedText.statusLabel,
            selected: status ?? [],
            filters: statusOptions,
          },
        ]
      : []),
    ...(reviewers && reviewers.length > 0
      ? [
          {
            id: 'reviewer',
            label: overviewText.filter.reviewerLabel,
            selected: reviewerUserId ?? [],
            filters: reviewers,
          },
        ]
      : []),
  ]

  return (
    <Box>
      {!isMobile && (
        <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
          {overviewText.filter.heading}
        </Text>
      )}
      <Filter
        labelClearAll={sharedText.filter.labelClearAll}
        labelOpen={sharedText.filter.labelOpen}
        labelClose={sharedText.filter.labelClose}
        labelClear={sharedText.filter.labelClear}
        labelTitle={sharedText.filter.labelTitle}
        labelResult={sharedText.filter.labelResult}
        onFilterClear={handleReset}
        variant={isTablet ? 'popover' : 'default'}
        filterInput={
          <Box marginTop={3}>
            <FilterInput
              name="query"
              placeholder={overviewText.filter.placeholder}
              value={q ?? ''}
              onChange={(value) => onQChange(value || null)}
              backgroundColor="white"
            />
          </Box>
        }
      >
        <FilterMultiChoice
          labelClear={sharedText.filter.labelClear}
          onChange={({ categoryId, selected }) => {
            if (categoryId === 'type') {
              const hasImprovement = selected.includes(IMPROVEMENT_PLAN_VALUE)
              const realTypes = selected.filter(
                (v) => v !== IMPROVEMENT_PLAN_VALUE,
              )
              onTypeChange(realTypes.length ? realTypes : null)
              onHasImprovementPlanChange(hasImprovement ? true : null)
            }
            if (categoryId === 'status')
              onStatusChange(selected.length ? selected : null)
            if (categoryId === 'reviewer')
              onReviewerChange(selected.length ? selected : null)
          }}
          onClear={(categoryId) => {
            if (categoryId === 'type') {
              onTypeChange(null)
              onHasImprovementPlanChange(null)
            }
            if (categoryId === 'status') onStatusChange(null)
            if (categoryId === 'reviewer') onReviewerChange(null)
          }}
          singleExpand={false}
          categories={[
            {
              id: 'type',
              label: overviewText.filter.categoryLabel,
              selected: [
                ...(type ?? []),
                ...(hasImprovementPlan ? [IMPROVEMENT_PLAN_VALUE] : []),
              ],
              filters: [
                { value: 'EQUALITY', label: sharedText.typeLabels.EQUALITY },
                { value: 'SALARY', label: sharedText.typeLabels.SALARY },
                {
                  value: IMPROVEMENT_PLAN_VALUE,
                  label: sharedText.typeLabels.IMPROVEMENT_PLAN,
                },
              ],
            },
            ...extraCategories,
          ]}
        />
        <Box className={styles.dateSection} paddingX={3} background={'white'}>
          <Box borderTopWidth="standard" borderColor="blue200" width="full" />
          <Box marginTop={1}>
            <Accordion
              dividerOnBottom={false}
              dividerOnTop={false}
              singleExpand={false}
            >
              <AccordionItem
                id="date-accordion-item"
                label={overviewText.filter.dateRangeLabel}
                labelVariant="h5"
                iconVariant="small"
              >
                <Stack space={2}>
                  <DatePicker
                    label={overviewText.filter.dateFrom}
                    placeholderText={overviewText.filter.dateFromPlaceholder}
                    size="xs"
                    selected={dateFrom}
                    maxDate={dateTo}
                    handleChange={(date) => onDateFromChange(date ?? undefined)}
                    locale="is"
                    appearInline
                  />
                  <DatePicker
                    label={overviewText.filter.dateTo}
                    placeholderText={overviewText.filter.dateToPlaceholder}
                    size="xs"
                    selected={dateTo}
                    minDate={dateFrom}
                    handleChange={(date) => onDateToChange(date ?? undefined)}
                    locale="is"
                    appearInline
                  />
                  {(dateFrom || dateTo) && (
                    <Box textAlign="right">
                      <Button
                        icon="reload"
                        size="small"
                        variant="text"
                        onClick={() => {
                          onDateFromChange(undefined)
                          onDateToChange(undefined)
                        }}
                      >
                        {overviewText.filter.clearDates}
                      </Button>
                    </Box>
                  )}
                </Stack>
              </AccordionItem>
            </Accordion>
          </Box>
        </Box>
        {onShowDelayedChange !== undefined && (
          <Box
            paddingX={3}
            paddingY={2}
            background="white"
            className={styles.delayedSection}
          >
            <Box borderTopWidth="standard" borderColor="blue200" width="full" />
            <Box paddingTop={2}>
              <Checkbox
                label={overviewText.filter.showDelayed}
                checked={showDelayed ?? false}
                onChange={(e) => onShowDelayedChange(e.target.checked)}
              />
            </Box>
          </Box>
        )}
      </Filter>
    </Box>
  )
}
