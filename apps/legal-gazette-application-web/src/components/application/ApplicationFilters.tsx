import { useEffect, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ApplicationStatusEnum, ApplicationTypeEnum } from '../../gen/fetch'
import { useApplicationFilters } from '../../hooks/useApplicationFilters'
import * as styles from './application.css'

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
]

// URL-friendly slugs for type filter
const TYPE_OPTIONS = [
  { value: 'almenn-auglysing', label: 'Almenn auglýsing' },
  { value: 'innkollun-throtabus', label: 'Innköllun þrotabús' },
  { value: 'innkollun-danarbus', label: 'Innköllun dánarbús' },
]

// URL-friendly slugs for status filter
const STATUS_OPTIONS = [
  { value: 'drog', label: 'Í vinnslu hjá notanda' },
  // { value: 'i-vinnslu', label: 'Í vinnslu' }, // currently no application status maps to this
  { value: 'innsent', label: 'Í vinnslu hjá ritsjórn' },
  { value: 'lokid', label: 'Innsent og útgefið' },
]

// Mapping functions to convert between URL slugs and API enums
export const mapTypeToEnum = (
  type: string | null | undefined,
): ApplicationTypeEnum | undefined => {
  if (!type) return undefined
  const typeMap: Record<string, ApplicationTypeEnum> = {
    'almenn-auglysing': ApplicationTypeEnum.COMMON,
    'innkollun-throtabus': ApplicationTypeEnum.RECALLBANKRUPTCY,
    'innkollun-danarbus': ApplicationTypeEnum.RECALLDECEASED,
  }
  return typeMap[type]
}

export const mapStatusToEnum = (
  status: string | null | undefined,
): ApplicationStatusEnum | undefined => {
  if (!status) return undefined
  const statusMap: Record<string, ApplicationStatusEnum> = {
    drog: ApplicationStatusEnum.DRAFT,
    // 'i-vinnslu': ApplicationStatusEnum.INPROGRESS,  // currently no application status maps to this
    innsent: ApplicationStatusEnum.SUBMITTED,
    lokid: ApplicationStatusEnum.FINISHED,
  }
  return statusMap[status]
}

export const ApplicationFilters = () => {
  const { params, updateParams, resetFilters } = useApplicationFilters()
  const [filterActive, setFilterActive] = useState(false)

  useEffect(() => {
    const isActive =
      !!params.search ||
      !!params.type ||
      !!params.status ||
      !!params.dateFrom ||
      !!params.dateTo
    setFilterActive(isActive)
  }, [
    params.search,
    params.type,
    params.status,
    params.dateFrom,
    params.dateTo,
  ])

  return (
    <Stack space={[2, 3]}>
      <Stack space={[2, 4]}>
        <Inline justifyContent="spaceBetween" alignY="center">
          <Text variant="h4">Leit og síun</Text>
          {filterActive && (
            <Button
              variant="text"
              icon="reload"
              iconType="outline"
              size="small"
              onClick={resetFilters}
            >
              Hreinsa
            </Button>
          )}
        </Inline>
        <Input
          name="application-search"
          placeholder="Leita í mínum auglýsingum"
          size="xs"
          icon={{ name: 'search', type: 'outline' }}
          value={params.search || ''}
          onChange={(event) => updateParams({ search: event.target.value })}
        />
      </Stack>

      <Box
        position="sticky"
        top={[3, 4]}
        background="white"
        borderRadius="large"
        padding={[2, 3]}
        marginBottom={2}
      >
        <GridContainer className={styles.sidebarStyles}>
          <GridRow>
            <GridColumn span="12/12">
              <Stack space={[1, 2]}>
                <Select
                  isClearable={true}
                  options={TYPE_OPTIONS}
                  label="Tegund"
                  size="xs"
                  placeholder="Allar tegundir"
                  backgroundColor="blue"
                  onChange={(opt) => updateParams({ type: opt?.value })}
                  value={
                    params.type
                      ? TYPE_OPTIONS.find((opt) => opt.value === params.type)
                      : null
                  }
                />
                <Select
                  isClearable={true}
                  options={STATUS_OPTIONS}
                  label="Staða"
                  size="xs"
                  placeholder="Allar stöður"
                  backgroundColor="blue"
                  onChange={(opt) => updateParams({ status: opt?.value })}
                  value={
                    params.status
                      ? STATUS_OPTIONS.find(
                          (opt) => opt.value === params.status,
                        )
                      : null
                  }
                />
                <DatePicker
                  locale="is"
                  label="Dagsetning frá"
                  placeholderText=""
                  backgroundColor="blue"
                  size="xs"
                  handleChange={(date) => updateParams({ dateFrom: date })}
                  selected={params.dateFrom}
                  maxDate={params.dateTo || new Date()}
                />
                <DatePicker
                  locale="is"
                  label="Dagsetning til"
                  maxDate={new Date()}
                  minDate={params.dateFrom || undefined}
                  placeholderText=""
                  backgroundColor="blue"
                  size="xs"
                  handleChange={(date) => updateParams({ dateTo: date })}
                  selected={params.dateTo}
                />
                <Select
                  placeholder="Fjöldi niðurstaða"
                  label="Fjöldi niðurstaða"
                  backgroundColor="blue"
                  size="xs"
                  options={PAGE_SIZE_OPTIONS}
                  onChange={(opt) => updateParams({ pageSize: opt?.value })}
                  value={
                    params.pageSize
                      ? PAGE_SIZE_OPTIONS.find(
                          (opt) => opt.value === params.pageSize,
                        )
                      : null
                  }
                />
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </Stack>
  )
}
