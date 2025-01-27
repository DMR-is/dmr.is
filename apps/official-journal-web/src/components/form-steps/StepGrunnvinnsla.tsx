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
  useAdvertTypes,
  useCase,
  useCategories,
  useDepartments,
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
    case: caseData,
    error: caseError,
    isLoading: isLoadingCase,
    mutate: refetchCase,
  } = useCase({
    caseId: data.id,
  })

  const { types, isLoadingTypes } = useAdvertTypes({
    typesParams: {
      department: caseData
        ? caseData.advertDepartment.id
        : data.advertDepartment.id,
      page: 1,
      pageSize: 1000,
    },
  })

  const { departments } = useDepartments()

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
                value={caseData.involvedParty.title}
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
                  label: caseData.advertDepartment.title,
                  value: caseData.advertDepartment.id,
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
                  label: caseData.advertType.title,
                  value: caseData.advertType.id,
                }}
                options={types?.map((t) => ({
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
                defaultValue={caseData.advertTitle}
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
                defaultValue={caseData.advertCategories.map((c) => ({
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
                {caseData.advertCategories.map((cat, i) => (
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
                  caseData.createdAt ? new Date(caseData.createdAt) : undefined
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
                selected={new Date(caseData.requestedPublicationDate)}
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
                checked={caseData.fastTrack}
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
                defaultValue={caseData.price}
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
                defaultChecked={caseData.paid}
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
