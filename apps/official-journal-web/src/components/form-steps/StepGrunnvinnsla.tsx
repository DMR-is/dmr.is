import debounce from 'lodash/debounce'

import {
  AlertMessage,
  Box,
  Checkbox,
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Select,
  SkeletonLoader,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { AdvertType, CaseWithAdvert, Department } from '../../gen/fetch'
import { useCase, useUpdateDepartment, useUpdatePrice } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { CaseOverviewGrid } from '../case-overview-grid/CaseOverviewGrid'
import { messages } from './messages'
type Props = {
  data: CaseWithAdvert
  departments: Array<Department>
  advertTypes: Array<AdvertType>
}

export const StepGrunnvinnsla = ({ data, advertTypes, departments }: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    data: caseData,
    error,
    isLoading,
    mutate: refetchCase,
  } = useCase({
    caseId: data.activeCase.id,
    options: {
      fallback: data,
    },
  })

  const { trigger: updatePrice, isMutating: isUpdatingPrice } = useUpdatePrice({
    caseId: data.activeCase.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updateDepartment } = useUpdateDepartment({
    caseId: data.activeCase.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  if (error) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="error"
          title={formatMessage(errorMessages.errorFetchingData)}
          message={formatMessage(errorMessages.internalServerError)}
        />
      </CaseOverviewGrid>
    )
  }

  if (isLoading) {
    return (
      <CaseOverviewGrid>
        <SkeletonLoader repeat={3} height={44} />
      </CaseOverviewGrid>
    )
  }

  if (!caseData) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="error"
          title={formatMessage(errorMessages.noDataTitle)}
          message={formatMessage(errorMessages.noDataText)}
        />
      </CaseOverviewGrid>
    )
  }

  const { activeCase, advert } = caseData._case

  const handleUpdatePrice = (newPrice: string) => {
    updatePrice({
      caseId: activeCase.id,
      price: newPrice,
    })
  }

  const debouncedUpdatePrice = debounce(handleUpdatePrice, 300)

  return (
    <>
      <Box marginBottom={4}>
        <GridContainer>
          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Text variant="h5">
                {formatMessage(messages.grunnvinnsla.group1title)}
              </Text>
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Input
                readOnly
                disabled
                name="institution"
                value={advert.involvedParty.title}
                onChange={() => console.log('change')}
                label={formatMessage(messages.grunnvinnsla.institution)}
                size="sm"
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                name="department"
                defaultValue={{
                  label: activeCase.advertDepartment.title,
                  value: activeCase.advertDepartment.id,
                }}
                options={departments.map((d) => ({
                  label: d.title,
                  value: d.id,
                }))}
                label={formatMessage(messages.grunnvinnsla.department)}
                size="sm"
                isSearchable={false}
                onChange={(option) => {
                  if (!option) return
                  updateDepartment({
                    caseId: activeCase.id,
                    departmentId: option.value,
                  })
                }}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                name="type"
                value={{
                  label: activeCase.advertType.title,
                  value: activeCase.advertType.id,
                }}
                options={advertTypes.map((t) => ({
                  label: t.title,
                  value: t.id,
                }))}
                label={formatMessage(messages.grunnvinnsla.type)}
                size="sm"
                isSearchable={false}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Input
                readOnly
                name="subject"
                value={activeCase.advertTitle}
                onChange={() => console.log('change')}
                label={formatMessage(messages.grunnvinnsla.subject)}
                size="sm"
                textarea
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Inline space={1}>
                {advert.categories.map((cat, i) => (
                  <Tag key={i} variant="white" outlined disabled>
                    {cat.title}
                  </Tag>
                ))}
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>

      <Box>
        <GridContainer>
          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Text variant="h5">
                {formatMessage(messages.grunnvinnsla.group2title)}
              </Text>
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <DatePicker
                readOnly
                disabled
                name="createdDate"
                selected={
                  activeCase.createdAt
                    ? new Date(activeCase.createdAt)
                    : undefined
                }
                label={formatMessage(messages.grunnvinnsla.createdDate)}
                size="sm"
                placeholderText=""
                locale="is"
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <DatePicker
                name="publicationDate"
                selected={new Date(activeCase.requestedPublicationDate)}
                label={formatMessage(messages.grunnvinnsla.publicationDate)}
                size="sm"
                placeholderText=""
                locale="is"
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                disabled
                name="fastTrack"
                checked={activeCase.fastTrack}
                label={formatMessage(messages.grunnvinnsla.fastTrack)}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Input
                loading={isUpdatingPrice}
                name="price"
                defaultValue={activeCase.price}
                label={formatMessage(messages.grunnvinnsla.price)}
                size="sm"
                type="tel"
                inputMode="numeric"
                onChange={(e) => debouncedUpdatePrice(e.target.value)}
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                name="paid"
                checked={activeCase.paid}
                label={formatMessage(messages.grunnvinnsla.paid)}
              />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
