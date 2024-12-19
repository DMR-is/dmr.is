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

import { Case } from '../../gen/fetch'
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
import { useUpdatePaid } from '../../hooks/api/update/useUpdatePaid'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { CaseOverviewGrid } from '../case-overview-grid/CaseOverviewGrid'
import { messages } from './messages'
type Props = {
  data: Case
}

export const StepGrunnvinnsla = ({ data }: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    data: caseData,
    error: caseError,
    isLoading: isLoadingCase,
    mutate: refetchCase,
  } = useCase({
    caseId: data.id,
    options: {
      fallback: data,
    },
  })

  const {
    data: typesData,
    isLoading: isLoadingTypes,
    mutate: refetchTypes,
  } = useTypes({
    params: {
      page: 1,
      pageSize: 1000,
      department: caseData
        ? caseData._case.advertDepartment.id
        : data.advertDepartment.id,
    },
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { departments } = useDepartments({
    options: {
      onSuccess: () => {
        refetchTypes()
      },
    },
  })

  const { trigger: updatePrice, isMutating: isUpdatingPrice } = useUpdatePrice({
    caseId: data.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updateDepartment } = useUpdateDepartment({
    caseId: data.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updateType, isMutating: isUpdatingTypes } = useUpdateType({
    caseId: data.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updateCategories, isMutating: isUpdatingCategories } =
    useUpdateCategories({
      caseId: data.id,
      options: {
        onSuccess: () => {
          refetchCase()
        },
      },
    })

  const { trigger: updateTitle } = useUpdateTitle({
    caseId: data.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  const { trigger: updatePublishDate } = useUpdatePublishDate({
    caseId: data.id,
    options: {
      onSuccess: () => {
        refetchCase()
      },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { trigger: updatePaid, isMutating: isUpdatingPaid } = useUpdatePaid({
    caseId: data.id,
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

  const handleUpdatePrice = (newPrice: number) => {
    updatePrice({
      price: newPrice,
    })
  }

  const handleUpdateTitle = (newTitle: string) => {
    updateTitle({
      title: newTitle,
    })
  }

  // TODO: Think this just queues up the updates, but doesn't cancel the previous one
  const debouncedUpdatePrice = debounce(handleUpdatePrice, 1000)
  // same here
  const debouncedUpdateTitle = debounce(handleUpdateTitle, 1000)

  const { data: categoriesData } = useCategories({
    params: { page: 1, pageSize: 1000 },
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

  const currentCase = caseData._case

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
                value={currentCase.involvedParty.title}
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
                  label: currentCase.advertDepartment.title,
                  value: currentCase.advertDepartment.id,
                }}
                options={departments?.map((d) => ({
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
                isDisabled={isLoadingTypes || isUpdatingTypes}
                defaultValue={{
                  label: currentCase.advertType.title,
                  value: currentCase.advertType.id,
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
                defaultValue={currentCase.advertTitle}
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
                defaultValue={currentCase.advertCategories.map((c) => ({
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
                {currentCase.advertCategories.map((cat, i) => (
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
                  currentCase.createdAt
                    ? new Date(currentCase.createdAt)
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
                selected={new Date(currentCase.requestedPublicationDate)}
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
                checked={currentCase.fastTrack}
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
                defaultValue={currentCase.price}
                label={formatMessage(messages.grunnvinnsla.price)}
                size="sm"
                type="number"
                inputMode="numeric"
                onChange={(e) => {
                  const price = parseInt(e.target.value, 10)
                  return debouncedUpdatePrice(price)
                }}
              />
            </GridColumn>

            <GridColumn span={['12/12', '12/12', '12/12', '6/12']}>
              <Checkbox
                name="paid"
                defaultChecked={currentCase.paid}
                onChange={(e) => {
                  updatePaid({
                    paid: e.target.checked,
                  })
                }}
                label={formatMessage(messages.grunnvinnsla.paid)}
              />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
