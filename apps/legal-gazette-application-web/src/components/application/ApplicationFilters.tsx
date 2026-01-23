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
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { ApplicationStatusEnum, ApplicationTypeEnum } from '../../gen/fetch'
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

type Props = {
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDateFromChange: (date: Date | null) => void
  onDateToChange: (date: Date | null) => void
  onSortByChange: (value: string) => void
  onPageSizeChange: (value: number) => void
  onResetFilters: () => void
}

export const ApplicationFilters = ({
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onSortByChange,
  onPageSizeChange,
  onResetFilters,
}: Props) => {
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
              onClick={onResetFilters}
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
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <Divider />
            <Select
              isClearable
              options={TYPE_OPTIONS}
              label="Tegund auglýsingar"
              size="xs"
              placeholder="Veldu tegund"
              onChange={(opt) => {
                if (!opt) return onTypeChange('')
                return onTypeChange(opt.value)
              }}
            />
            <Select
              isClearable
              options={STATUS_OPTIONS}
              label="Staða auglýsingar"
              size="xs"
              placeholder="Veldu stöðu"
              onChange={(opt) => {
                if (!opt) return onStatusChange('')
                return onStatusChange(opt.value)
              }}
            />
            <Stack space={1}>
              <DatePicker
                locale="is"
                label="Dagsetning frá"
                placeholderText="Frá og með degi..."
                size="xs"
                handleChange={(date) => onDateFromChange(date)}
              />
              <Inline align="right">
                <Button
                  size="small"
                  variant="text"
                  icon="reload"
                  onClick={() => onDateFromChange(null)}
                >
                  Hreinsa val
                </Button>
              </Inline>
            </Stack>
            <Stack space={1}>
              <DatePicker
                locale="is"
                label="Dagsetning til"
                placeholderText="Til og með degi..."
                size="xs"
                handleChange={(date) => onDateToChange(date)}
              />
              <Inline align="right">
                <Button
                  size="small"
                  variant="text"
                  icon="reload"
                  onClick={() => onDateToChange(null)}
                >
                  Hreinsa val
                </Button>
              </Inline>
            </Stack>
            <Select
              isClearable
              placeholder="Raða eftir"
              label="Raða eftir"
              size="xs"
              options={[
                { value: 'dateDesc', label: 'Dagsetningu (nýjast fyrst)' },
                { value: 'dateAsc', label: 'Dagsetningu (eldst fyrst)' },
              ]}
              onChange={(opt) => {
                if (!opt) return onSortByChange('')
                return onSortByChange(opt.value)
              }}
            />
            <Select
              isClearable
              placeholder="Fjöldi niðurstaða"
              label="Fjöldi niðurstaða"
              size="xs"
              options={PAGE_SIZE_OPTIONS}
              onChange={(opt) => {
                if (!opt) return onPageSizeChange(5)
                return onPageSizeChange(opt.value)
              }}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
