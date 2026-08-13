'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CompanyDto, CompanySectorEnum } from '../../../../gen/fetch'
import { companiesText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import {
  SECTOR_FILTER_OPTIONS,
  SECTOR_LABEL,
} from '../../../companies/companyStatus'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

type Props = {
  company: CompanyDto
}

/**
 * Inline-editable ownership sector, following the `CompanyEmailField` pattern.
 *
 * This is the admin's only way to fix a company automatic classification could
 * not place — either RSK was never consulted for it, or it returned a legal form
 * the server does not map. Both cases show as `UNKNOWN`.
 *
 * The two hints below the value exist so the admin can tell those cases apart
 * without reading logs: `legalFormName` shows what RSK actually said (so an
 * unmapped form is visible), and the override hint shows when the current value
 * is a human decision rather than a derived one.
 */
export const CompanySectorField = ({ company }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState<CompanySectorEnum>(company.sector)

  const updateSector = useMutation({
    ...trpc.company.updateSector.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.company.get.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.company.list.queryKey() })
      toast.success(t.sectorSavedToast)
      setIsEditing(false)
    },
    onError: () => toast.error(t.sectorErrorToast),
  })

  if (!isEditing) {
    return (
      <Box display="flex" flexDirection="column" rowGap={1}>
        <Box display="flex" alignItems="center" columnGap={1}>
          <Text>{SECTOR_LABEL[company.sector]}</Text>
          <Button
            variant="text"
            size="small"
            icon="pencil"
            iconType="outline"
            onClick={() => {
              setValue(company.sector)
              setIsEditing(true)
            }}
          >
            {t.sectorEditButton}
          </Button>
        </Box>

        {company.sector === CompanySectorEnum.UNKNOWN && (
          <Text variant="small" color="dark300">
            {t.sectorUnknownHint}
          </Text>
        )}

        {company.legalFormName && (
          <Text variant="small" color="dark300">
            {t.sectorLegalFormHint}
            {company.legalFormName}
          </Text>
        )}

        {company.sectorOverride && (
          <Text variant="small" color="dark300">
            {t.sectorOverrideHint}
          </Text>
        )}
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" rowGap={1} marginTop={1}>
      <Select
        name="company-sector"
        size="xs"
        placeholder={t.sectorPlaceholder}
        options={SECTOR_FILTER_OPTIONS}
        value={SECTOR_FILTER_OPTIONS.find((o) => o.value === value) ?? null}
        onChange={(option) =>
          setValue((option?.value as CompanySectorEnum) ?? company.sector)
        }
      />
      <Box display="flex" columnGap={1}>
        <Button
          size="small"
          onClick={() => updateSector.mutate({ id: company.id, sector: value })}
          loading={updateSector.isPending}
          disabled={value === company.sector}
        >
          {t.sectorSaveButton}
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={() => {
            setValue(company.sector)
            setIsEditing(false)
          }}
          disabled={updateSector.isPending}
        >
          {t.sectorCancelButton}
        </Button>
      </Box>
    </Box>
  )
}
