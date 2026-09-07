'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CompanyDto, CompanyStatusEnum } from '../../../../gen/fetch'
import { companiesText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import {
  COMPANY_STATUS_FILTER_OPTIONS,
  COMPANY_STATUS_LABEL,
} from '../../../companies/companyStatus'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

type Props = {
  company: CompanyDto
}

/**
 * Inline-editable register lifecycle status, following `CompanySectorField`.
 *
 * Until this existed the column was unreachable from the back office: an admin
 * could neither see it nor change it, and the only things that moved it were
 * the annual register import (absent from the import → INACTIVE, reappears →
 * ACTIVE) and raw SQL. The import still owns the bulk case; this is the manual
 * one the enum was always documented for — a company that went bankrupt or
 * merged into another between imports.
 *
 * ⚠️ Not the compliance status. The detail sidebar's "Staða fyrirtækis" tag is
 * `reportStatus` — what the company still owes. This is whether it is on the
 * register at all, which is why the label says "í skrá" and why the two are
 * never rendered as one value.
 *
 * The reason is optional and free text, and it is the whole audit story: the
 * status column keeps no history, so `STATUS_CHANGED` on the company timeline
 * is the only record of WHY a company was deactivated. Worth typing.
 */
export const CompanyRegisterStatusField = ({ company }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState<CompanyStatusEnum>(company.status)
  const [reason, setReason] = useState('')

  const updateStatus = useMutation({
    ...trpc.company.updateStatus.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.company.get.queryKey({ id: company.id }),
      })
      queryClient.invalidateQueries({ queryKey: trpc.company.list.queryKey() })
      // The change is recorded as a STATUS_CHANGED event, so the timeline is
      // stale the moment this succeeds.
      queryClient.invalidateQueries({
        queryKey: trpc.company.getTimeline.queryKey({ id: company.id }),
      })
      toast.success(
        variables.status === CompanyStatusEnum.ACTIVE
          ? t.registerStatusActivatedToast
          : t.registerStatusDeactivatedToast,
      )
      setReason('')
      setIsEditing(false)
    },
    onError: () => toast.error(t.registerStatusErrorToast),
  })

  const startEditing = () => {
    setValue(company.status)
    setReason('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setValue(company.status)
    setReason('')
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <Box display="flex" flexDirection="column" rowGap={1}>
        <Box display="flex" alignItems="center" columnGap={1}>
          <Text>{COMPANY_STATUS_LABEL[company.status]}</Text>
          <Button
            variant="text"
            size="small"
            icon="pencil"
            iconType="outline"
            onClick={startEditing}
          >
            {t.registerStatusEditButton}
          </Button>
        </Box>

        {company.status === CompanyStatusEnum.INACTIVE && (
          <Text variant="small" color="dark300">
            {t.registerStatusInactiveHint}
          </Text>
        )}
      </Box>
    )
  }

  const trimmedReason = reason.trim()

  return (
    <Box display="flex" flexDirection="column" rowGap={1} marginTop={1}>
      <Select
        name="company-register-status"
        size="xs"
        placeholder={t.registerStatusPlaceholder}
        options={COMPANY_STATUS_FILTER_OPTIONS}
        value={
          COMPANY_STATUS_FILTER_OPTIONS.find((o) => o.value === value) ?? null
        }
        onChange={(option) =>
          setValue((option?.value as CompanyStatusEnum) ?? company.status)
        }
      />
      <Input
        name="company-register-status-reason"
        size="xs"
        placeholder={t.registerStatusReasonPlaceholder}
        label={t.registerStatusReasonLabel}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Box display="flex" columnGap={1}>
        <Button
          size="small"
          onClick={() =>
            updateStatus.mutate({
              id: company.id,
              status: value,
              // Empty input means "no reason given" — send null rather than
              // writing an empty string onto the timeline event.
              reason: trimmedReason === '' ? null : trimmedReason,
            })
          }
          loading={updateStatus.isPending}
          disabled={value === company.status}
        >
          {t.registerStatusSaveButton}
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={cancelEditing}
          disabled={updateStatus.isPending}
        >
          {t.registerStatusCancelButton}
        </Button>
      </Box>
    </Box>
  )
}
