import {
  Button,
  DatePicker,
  Divider,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { ApplicationStatusEnum, ApplicationTypeEnum } from '../../gen/fetch'
import { useApplicationFilters } from '../../hooks/useApplicationFilters'
import * as styles from './application.css'

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
]

const TYPE_OPTIONS = [
  { value: ApplicationTypeEnum.COMMON, label: 'Almenn auglýsing' },
  { value: ApplicationTypeEnum.RECALLBANKRUPTCY, label: 'Innköllun þrotabús' },
  { value: ApplicationTypeEnum.RECALLDECEASED, label: 'Innköllun dánarbús' },
]

const STATUS_OPTIONS = [
  { value: ApplicationStatusEnum.DRAFT, label: 'Drög' },
  { value: ApplicationStatusEnum.INPROGRESS, label: 'Í vinnslu' },
  { value: ApplicationStatusEnum.SUBMITTED, label: 'Innsent' },
  { value: ApplicationStatusEnum.FINISHED, label: 'Lokið' },
]

export const ApplicationFilters = () => {
  const { params, updateParams, resetFilters } = useApplicationFilters()

  return (
    <GridContainer className={styles.sidebarStyles}>
      <GridRow marginBottom={[2, 3]}>
        <GridColumn span="12/12">
          <Inline justifyContent="spaceBetween" alignY="center">
            <Text variant="h4">Leit</Text>
            <Button
              variant="text"
              icon="reload"
              iconType="outline"
              size="small"
              onClick={resetFilters}
            >
              Hreinsa
            </Button>
          </Inline>
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <Stack space={2}>
            <Input
              name="application-search"
              label="Leita í mínum auglýsingum"
              placeholder="Sláðu inn leitarstreng"
              size="xs"
              icon={{ name: 'search', type: 'outline' }}
              value={params.search || ''}
              onChange={(event) => updateParams({ search: event.target.value })}
            />
            <Divider />
            <Select
              isClearable={true}
              options={TYPE_OPTIONS}
              label="Tegund auglýsingar"
              size="xs"
              placeholder="Veldu tegund"
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
              label="Staða auglýsingar"
              size="xs"
              placeholder="Veldu stöðu"
              onChange={(opt) => updateParams({ status: opt?.value })}
              value={
                params.status
                  ? STATUS_OPTIONS.find((opt) => opt.value === params.status)
                  : null
              }
            />
            <DatePicker
              locale="is"
              label="Dagsetning frá"
              placeholderText="Frá og með degi..."
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
              placeholderText="Til og með degi..."
              size="xs"
              handleChange={(date) => updateParams({ dateTo: date })}
              selected={params.dateTo}
            />
            <Select
              placeholder="Fjöldi niðurstaða"
              label="Fjöldi niðurstaða"
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
  )
}
