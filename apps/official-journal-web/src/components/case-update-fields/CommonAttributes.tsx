import { AccordionItem, Inline, Stack } from '@island.is/island-ui/core'

import { CaseDetailed, Department } from '../../gen/fetch'
import { useAdvertTypes, useCategories } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

type Props = {
  currentCase: CaseDetailed
  departments: Department[]
}

export const UpdateCaseCommonFields = ({ currentCase, departments }: Props) => {
  const { formatMessage } = useFormatMessage()

  const departmentOptions = departments.map((d) => ({
    label: d.title,
    value: d.id,
  }))

  const { types, isLoadingTypes } = useAdvertTypes({
    typesParams: {
      department: currentCase.id,
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
          label={formatMessage(messages.grunnvinnsla.department)}
          value={departmentOptions.find(
            (dep) => dep.value === currentCase.advertDepartment.id,
          )}
          options={departmentOptions}
        />
        <OJOISelect
          width="half"
          isLoading={isLoadingTypes}
          label={formatMessage(messages.grunnvinnsla.type)}
          options={typeOptions}
          value={typeOptions?.find(
            (t) => t.value === currentCase.advertType?.id,
          )}
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
          />
          <Inline>
            {currentCase.advertCategories?.map((category, i) => (
              <OJOITag key={i} variant="blue" outlined closeable>
                {category.title}
              </OJOITag>
            ))}
          </Inline>
        </Stack>
      </Stack>
    </AccordionItem>
  )
}
