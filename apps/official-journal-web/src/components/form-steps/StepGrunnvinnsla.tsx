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

import { CaseWithAdvert } from '../../gen/fetch'
import {
  useCase,
  useCategories,
  useDepartments,
  useTypes,
  useUpdateCategories,
  useUpdateDepartment,
  useUpdatePrice,
  useUpdatePublishDate,
  useUpdateTitle,
  useUpdateType,
} from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { CaseOverviewGrid } from '../case-overview-grid/CaseOverviewGrid'
import { messages } from './messages'
type Props = {
  data: CaseWithAdvert
}

export const StepGrunnvinnsla = ({ data }: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    data: caseData,
    error: caseError,
    isLoading: isLoadingCase,
    mutate: refetchCase,
  } = useCase({
    caseId: data.activeCase.id,
    options: {
      fallback: data,
    },
  })

  const {
    data: typesData,
    isLoading: isLoadingTypes,
    mutate: refetchTypes,
  } = useTypes({
    query: `pageSize=1000&department=${
      caseData
        ? caseData._case.activeCase.advertDepartment.id
        : data.activeCase.advertDepartment.id
    }`,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { data: departmentsData } = useDepartments({
    options: {
      onSuccess: () => {
        refetchTypes()
      },
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

  const { trigger: updateType, isMutating: isUpdatingType } = useUpdateType({
    caseId: data.activeCase.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updateCategories, isMutating: isUpdatingCategories } =
    useUpdateCategories({
      caseId: data.activeCase.id,
      options: {
        onSuccess: () => {
          refetchCase()
        },
      },
    })

  const { trigger: updateTitle } = useUpdateTitle({
    caseId: data.activeCase.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updatePublishDate } = useUpdatePublishDate({
    caseId: data.activeCase.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const handleCategoryUpdate = (option: { label: string; value: string }) => {
    updateCategories({
      categoryIds: [option.value],
    })
  }

  const handleUpdatePrice = (newPrice: string) => {
    updatePrice({
      price: newPrice,
    })
  }

  const handleUpdateTitle = (newTitle: string) => {
    updateTitle({
      title: newTitle,
    })
  }

  const debouncedUpdatePrice = debounce(handleUpdatePrice, 300)

  const debouncedUpdateTitle = debounce(handleUpdateTitle, 300)

  const { data: categoriesData } = useCategories({
    query: {
      pageSize: '1000',
    },
  })

  if (caseError) {
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

  if (isLoadingCase) {
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
                backgroundColor="blue"
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
                backgroundColor="blue"
                name="department"
                defaultValue={{
                  label: activeCase.advertDepartment.title,
                  value: activeCase.advertDepartment.id,
                }}
                options={departmentsData?.departments.map((d) => ({
                  label: d.title,
                  value: d.id,
                }))}
                label={formatMessage(messages.grunnvinnsla.department)}
                size="sm"
                isSearchable={false}
                onChange={(option) => {
                  if (!option) return
                  updateDepartment({
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
                backgroundColor="blue"
                label={formatMessage(messages.grunnvinnsla.type)}
                size="sm"
                isDisabled={isLoadingTypes}
                defaultValue={{
                  label: activeCase.advertType.title,
                  value: activeCase.advertType.id,
                }}
                options={typesData?.types.map((t) => ({
                  label: t.title,
                  value: t.id,
                }))}
                onChange={(option) => {
                  if (!option) return
                  updateType({
                    typeId: option.value,
                  })
                }}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Input
                backgroundColor="blue"
                name="subject"
                defaultValue={activeCase.advertTitle}
                onChange={(e) => debouncedUpdateTitle(e.target.value)}
                label={formatMessage(messages.grunnvinnsla.subject)}
                size="sm"
                textarea
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Select
                isDisabled={isUpdatingCategories}
                size="sm"
                label={formatMessage(messages.grunnvinnsla.categories)}
                backgroundColor="blue"
                name="categories"
                options={categoriesData?.categories.map((c) => ({
                  label: c.title,
                  value: c.id,
                }))}
                defaultValue={activeCase.advertCategories.map((c) => ({
                  label: c.title,
                  value: c.id,
                }))}
                onChange={(option) => {
                  if (!option) return
                  handleCategoryUpdate(option)
                }}
              />
            </GridColumn>
          </GridRow>

          <GridRow marginBottom={2} rowGap={2} alignItems="center">
            <GridColumn span={['12/12']}>
              <Inline space={1}>
                {activeCase.advertCategories.map((cat, i) => (
                  <Tag
                    disabled={isUpdatingCategories}
                    onClick={() =>
                      handleCategoryUpdate({
                        label: cat.title,
                        value: cat.id,
                      })
                    }
                    key={i}
                    variant="white"
                    outlined
                  >
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
                backgroundColor="blue"
                name="publicationDate"
                selected={new Date(activeCase.requestedPublicationDate)}
                label={formatMessage(messages.grunnvinnsla.publicationDate)}
                size="sm"
                placeholderText=""
                locale="is"
                handleChange={(e) => {
                  updatePublishDate({
                    date: e.toISOString(),
                  })
                }}
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
                backgroundColor="blue"
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
