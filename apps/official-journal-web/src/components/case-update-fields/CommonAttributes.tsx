import { AccordionItem, Inline, Stack, toast } from '@island.is/island-ui/core'

import { Department } from '../../gen/fetch'
import {
  useAdvertTypes,
  useCategories,
  useUpdateDepartment,
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

  const { currentCase, error, isLoading, isValidating, refetch } =
    useCaseContext()

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

  const { trigger } = useUpdateDepartment({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success(`Deild uppfærð`)
        refetch()
      },
      onError: () => {
        toast.error(`Ekki tókst að uppfæra deild`)
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
          label={formatMessage(messages.grunnvinnsla.department)}
          value={departmentOptions.find(
            (dep) => dep.value === currentCase.advertDepartment.id,
          )}
          options={departmentOptions}
          onChange={(opt) => {
            if (!opt) return

            trigger({
              departmentId: opt.value,
            })
          }}
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
