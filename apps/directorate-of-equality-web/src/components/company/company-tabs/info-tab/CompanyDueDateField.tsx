'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CompanyDto, ReportTypeEnum } from '../../../../gen/fetch'
import { companiesText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { formatTimestampDate } from '../../../../lib/utils'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

type Props = {
  company: CompanyDto
  reportType: ReportTypeEnum
}

/** The stored instant as a local calendar day, the way `formatTimestampDate` reads it. */
const toLocalDay = (iso: string | null | undefined): Date | null => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** `YYYY-MM-DD` off the picked day's LOCAL parts — see `toIsoDate` in CreateSalaryReportDrawer. */
const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Inline-editable next-due date for one report kind, following
 * `CompanyEmailField`. Always editable, whether or not the company owes the
 * report, and never clearable. Never moves backwards: the earliest pickable day
 * is the current due date, or today when there is none (the API enforces the
 * same). The change and its optional reason land on the company timeline, and
 * the next approval overwrites the date again.
 */
export const CompanyDueDateField = ({ company, reportType }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const isSalary = reportType === ReportTypeEnum.SALARY
  const currentIso = isSalary
    ? company.nextSalaryReportDueAt
    : company.nextEqualityReportDueAt
  const overdue = isSalary
    ? company.salaryReportOverdue
    : company.equalityReportOverdue
  const currentDay = toLocalDay(currentIso)

  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState<Date | null>(currentDay)
  const [reason, setReason] = useState('')

  const updateDueDate = useMutation({
    ...trpc.company.updateDueDate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.company.get.queryKey({ id: company.id }),
      })
      queryClient.invalidateQueries({ queryKey: trpc.company.list.queryKey() })
      // Recorded as a *_DUE_DATE_CHANGED event.
      queryClient.invalidateQueries({
        queryKey: trpc.company.getTimeline.queryKey({ id: company.id }),
      })
      toast.success(t.dueDateSavedToast)
      setReason('')
      setIsEditing(false)
    },
    onError: () => toast.error(t.dueDateErrorToast),
  })

  const startEditing = () => {
    setValue(currentDay)
    setReason('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setValue(currentDay)
    setReason('')
    setIsEditing(false)
  }

  const editLabel = isSalary ? t.dueDateEditSalary : t.dueDateEditEquality

  if (!isEditing) {
    return (
      <Box display="flex" alignItems="center" columnGap={1} flexWrap="wrap">
        <Text color={overdue ? 'red600' : undefined}>
          {formatTimestampDate(currentIso)}
        </Text>
        {overdue && (
          <Tag variant="red" outlined disabled light>
            {companiesText.overdueTag}
          </Tag>
        )}
        <Button
          variant="text"
          size="small"
          icon="pencil"
          iconType="outline"
          onClick={startEditing}
          aria-label={editLabel}
        >
          {t.dueDateEditButton}
        </Button>
      </Box>
    )
  }

  const today = new Date()
  const minDate =
    currentDay ??
    new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const nextDueDate = value ? toIsoDate(value) : null
  const isUnchanged =
    nextDueDate === null ||
    (currentDay !== null && nextDueDate === toIsoDate(currentDay))
  const trimmedReason = reason.trim()

  return (
    <Box display="flex" flexDirection="column" rowGap={1} marginTop={1}>
      <DatePicker
        name={`company-due-date-${reportType.toLowerCase()}`}
        label={editLabel}
        placeholderText={t.dueDatePlaceholder}
        locale="is"
        size="xs"
        icon={{ name: 'calendar', type: 'outline' }}
        minDate={minDate}
        selected={value}
        handleChange={(date) => setValue(date ?? null)}
      />
      <Input
        name={`company-due-date-reason-${reportType.toLowerCase()}`}
        size="xs"
        label={t.dueDateReasonLabel}
        placeholder={t.dueDateReasonPlaceholder}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Box display="flex" columnGap={1}>
        <Button
          size="small"
          onClick={() =>
            nextDueDate &&
            updateDueDate.mutate({
              id: company.id,
              reportType,
              dueDate: nextDueDate,
              // Empty means no reason given — null, not an empty string.
              reason: trimmedReason === '' ? null : trimmedReason,
            })
          }
          loading={updateDueDate.isPending}
          disabled={isUnchanged}
        >
          {t.dueDateSaveButton}
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={cancelEditing}
          disabled={updateDueDate.isPending}
        >
          {t.dueDateCancelButton}
        </Button>
      </Box>
    </Box>
  )
}
