'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { companiesText } from '../../../lib/text'

const t = companiesText.detailView

// 'on-hold' is not yet in the backend enum — hardcoded until API is updated
const STATUS_OPTIONS = [
  { label: 'Vantar jafnréttisáætlun', value: 'missing-equality' },
  { label: 'Hefur jafnréttisáætlun', value: 'has-equality' },
  { label: 'Vantar launagreiningu', value: 'missing-salary' },
  { label: 'Í samræmi', value: 'compliant' },
  { label: 'Í bið', value: 'on-hold' },
]

type Props = {
  status: string
  onChange: (status: string) => void
}

export const CompanyStatusSelect = ({ status, onChange }: Props) => {
  const showFinesButton =
    status === 'missing-equality' || status === 'missing-salary'

  const value = STATUS_OPTIONS.find((o) => o.value === status) ?? null

  return (
    <Stack space={2}>
      <Text variant="h5">{t.sidebarTitle}</Text>
      <Select
        size="sm"
        label={t.statusLabel}
        options={STATUS_OPTIONS}
        value={value}
        onChange={(opt) => {
          if (opt) onChange(opt.value)
        }}
      />
      {showFinesButton && (
        <Button
          fluid
          size="small"
          icon="warning"
          iconType="outline"
          onClick={() => toast.info(t.finesButton + ' — ekki útfært')}
        >
          <Text color="white" variant="small" fontWeight="semiBold">
            {t.finesButton}
          </Text>
        </Button>
      )}
    </Stack>
  )
}
