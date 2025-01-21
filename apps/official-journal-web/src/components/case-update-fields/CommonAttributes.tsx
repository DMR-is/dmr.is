import { c } from 'next-usequerystate/dist/serializer-DjSGvhZt'

import { AccordionItem, Inline, Stack, toast } from '@island.is/island-ui/core'

import { Department } from '../../gen/fetch'
import {
  useAdvertTypes,
  useCategories,
  useUpdateCategories,
  useUpdateDepartment,
  useUpdateType,
} from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

type Props = {
  departments: Department[]
}

export const UpdateCaseCommonFields = ({ departments }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, refetch } = useCaseContext()

  const departmentOptions = departments.map((d) => ({
    label: d.title,
    value: d.id,
  }))

  const { types, isLoadingTypes } = useAdvertTypes({
    typesParams: {
      department: currentCase.advertDepartment.id,
      page: 1,
      pageSize: 100,
    },
  })

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories({
      params: {
        page: 1,
        pageSize: 500,
      },
    })

  const typeOptions = types?.map((t) => ({
    label: t.title,
    value: t.id,
  }))

  const categoriesOptions = categoriesData?.categories.map((c) => ({
    label: c.title,
    value: c.id,
  }))

  const defaultCategory = currentCase.advertCategories?.map((c) => ({
    label: c.title,
    value: c.id,
  }))

  const { trigger: updateDepartment, isMutating: isUpdatingDepartment } =
    useUpdateDepartment({
      caseId: currentCase.id,
      options: {
        onSuccess: () => {
          toast.success(`Deild máls uppfærð`)
          refetch()
        },
        onError: () => {
          toast.error(`Ekki tókst að uppfæra deild`)
        },
      },
    })

  const { trigger: updateType, isMutating: isUpdatingType } = useUpdateType({
    caseId: currentCase.id,
    options: {
      onError: () => {
        toast.error(`Ekki tókst að uppfæra tegund máls`)
      },
      onSuccess: () => {
        toast.success(`Tegund máls uppfærð`)
        refetch()
      },
    },
  })

  const { trigger: updateCategories, isMutating: isUpdatingCategory } =
    useUpdateCategories({
      caseId: currentCase.id,
      options: {
        onError: () => {
          toast.error(`Ekki tókst að uppfæra efnisflokka máls`)
        },
        onSuccess: () => {
          toast.success(`Efnisflokkar máls uppfærðir`)
          refetch()
        },
      },
    })

  return (
    <AccordionItem
      id="case-attributes"
      startExpanded
      label={formatMessage(messages.grunnvinnsla.group1title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={2}>
        <OJOIInput
          disabled
          width="half"
          name="institution"
          value={currentCase.involvedParty.title}
          label={formatMessage(messages.grunnvinnsla.institution)}
        />
        <OJOISelect
          width="half"
          name="department"
          isValidating={isUpdatingDepartment}
          label={formatMessage(messages.grunnvinnsla.department)}
          value={departmentOptions.find(
            (dep) => dep.value === currentCase.advertDepartment.id,
          )}
          options={departmentOptions}
          onChange={(opt) => {
            if (!opt) return

            updateDepartment({
              departmentId: opt.value,
            })
          }}
        />
        <OJOISelect
          width="half"
          isLoading={isLoadingTypes}
          isValidating={isUpdatingType}
          label={formatMessage(messages.grunnvinnsla.type)}
          options={typeOptions}
          value={typeOptions?.find(
            (t) => t.value === currentCase.advertType?.id,
          )}
          onChange={(opt) => {
            if (!opt) return

            updateType({
              typeId: opt.value,
            })
          }}
        />
        <OJOIInput
          textarea
          name="advertTitle"
          rows={4}
          defaultValue={currentCase.advertTitle}
          label={formatMessage(messages.grunnvinnsla.subject)}
        />
        <Stack space={1}>
          <OJOISelect
            isLoading={isLoadingCategories}
            width="half"
            label={formatMessage(messages.grunnvinnsla.categories)}
            options={categoriesOptions}
            defaultValue={defaultCategory}
            isValidating={isUpdatingCategory}
            onChange={(opt) => {
              if (!opt) return

              updateCategories({
                categoryIds: [opt.value],
              })
            }}
          />
          <Inline space={1} flexWrap="wrap">
            {currentCase.advertCategories?.map((category, i) => (
              <OJOITag
                isValidating={isUpdatingCategory}
                key={i}
                variant="blue"
                outlined
                closeable
                onClick={() => updateCategories({ categoryIds: [category.id] })}
              >
                {category.title}
              </OJOITag>
            ))}
          </Inline>
        </Stack>
      </Stack>
    </AccordionItem>
  )
}
