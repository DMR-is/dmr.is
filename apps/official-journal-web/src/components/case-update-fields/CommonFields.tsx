import debounce from 'lodash/debounce'

import { toast } from '@dmr.is/ui/utils/toast'

import {
  AccordionItem,
  AlertMessage,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import {
  useUpdateCategories,
  useUpdateDepartment,
  useUpdateTitle,
  useUpdateType,
} from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const CommonFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  const {
    currentCase,
    refetch,
    departmentOptions,
    categoryOptions,
    typeOptions,
    isValidatingTypes,
    canEdit,
    isPublishedOrRejected,
  } = useCaseContext()

  const { trigger: updateDepartment, isMutating: isUpdatingDepartment } =
    useUpdateDepartment({
      caseId: currentCase.id,
      options: {
        onSuccess: () => {
          toast.success(`Deild auglýsingar uppfærð`)
          refetch()
        },
        onError: () => {
          toast.error(`Ekki tókst að uppfæra deild auglýsingar`)
        },
      },
    })

  const { trigger: updateType, isMutating: isUpdatingType } = useUpdateType({
    caseId: currentCase.id,
    options: {
      onError: () => {
        toast.error(`Ekki tókst að uppfæra tegund auglýsingar`)
      },
      onSuccess: () => {
        toast.success(`Tegund auglýsingar uppfærð`)
        refetch()
      },
    },
  })

  const { trigger: updateCategories, isMutating: isUpdatingCategory } =
    useUpdateCategories({
      caseId: currentCase.id,
      options: {
        onError: () => {
          toast.error(`Ekki tókst að uppfæra efnisflokka auglýsingar`)
        },
        onSuccess: () => {
          toast.success(`Efnisflokkar auglýsingar uppfærðir`)
          refetch()
        },
      },
    })

  const { trigger: updateTitle, isMutating: isUpdatingTitle } = useUpdateTitle({
    caseId: currentCase.id,
    options: {
      onError: () => {
        toast.error(`Ekki tókst að uppfæra heiti auglýsingar`)
      },
      onSuccess: () => {
        toast.success(`Heiti auglýsingar uppfært`)
        refetch()
      },
    },
  })

  const debounceUpdateTitle = debounce(updateTitle, 500)
  const updateTitleHandler = (val: string) => {
    debounceUpdateTitle.cancel()
    debounceUpdateTitle({
      title: val,
    })
  }

  const latestSelectedCategory =
    currentCase.advertCategories.length > 0
      ? categoryOptions.find(
          (cat) =>
            cat.value ===
            currentCase.advertCategories[
              currentCase.advertCategories.length - 1
            ].id,
        )
      : null

  const advertDisplayId = currentCase.proposedAdvertId ?? currentCase.advertId
  return (
    <AccordionItem
      id="commonFields"
      expanded={expanded}
      onToggle={onToggle}
      label={formatMessage(messages.grunnvinnsla.group1title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={2}>
        <OJOIInput
          name="applicationId"
          readOnly
          label="Auðkenni umsóknar"
          size="sm"
          width="half"
          value={
            currentCase.applicationId
              ? currentCase.applicationId
              : 'Engin umsókn'
          }
          copyOptions={
            currentCase.applicationId
              ? {
                  toCopy: currentCase.applicationId,
                  label: 'Auðkenni umsóknar afritað',
                }
              : undefined
          }
        />
        <OJOIInput
          name="applicationId"
          readOnly
          label={
            isPublishedOrRejected
              ? 'Auðkenni auglýsingar'
              : 'Verðandi auðkenni auglýsingar'
          }
          size="sm"
          width="half"
          value={advertDisplayId ?? 'Engin auglýsing á máli'}
          copyOptions={
            advertDisplayId
              ? {
                  toCopy: `${advertDisplayId}`,
                  label: 'Auðkenni auglýsingar afritað',
                }
              : undefined
          }
        />
        <OJOIInput
          disabled
          width="half"
          name="institution"
          value={currentCase.involvedParty.title}
          label={formatMessage(messages.grunnvinnsla.institution)}
        />
        <OJOISelect
          isDisabled={!canEdit}
          width="half"
          name="department"
          isValidating={isUpdatingDepartment}
          label={formatMessage(messages.grunnvinnsla.department)}
          value={departmentOptions.find(
            (dep) => dep.value === currentCase.advertDepartment.id,
          )}
          options={departmentOptions}
          onChange={(opt) => {
            if (!opt) {
              return toast.warning('Eitthvað fór úrskeiðis')
            }

            updateDepartment({
              departmentId: opt.value,
            })
          }}
        />
        <OJOISelect
          isDisabled={!canEdit}
          width="half"
          isLoading={isValidatingTypes}
          isValidating={isUpdatingType}
          label={formatMessage(messages.grunnvinnsla.type)}
          options={typeOptions}
          value={typeOptions?.find(
            (t) => t.value === currentCase.advertType?.id,
          )}
          onChange={(opt) => {
            if (!opt) {
              return toast.warning('Eitthvað fór úrskeiðis')
            }

            updateType({
              typeId: opt.value,
            })
          }}
        />
        <OJOIInput
          disabled={!canEdit}
          textarea
          name="advertTitle"
          isValidating={isUpdatingTitle}
          rows={4}
          defaultValue={currentCase.advertTitle}
          label={formatMessage(messages.grunnvinnsla.subject)}
          onChange={(e) => updateTitleHandler(e.target.value)}
        />
        <Stack space={1}>
          {currentCase.advertCategories.length === 0 && (
            <AlertMessage
              type="warning"
              title="Athugið"
              message="Engir efnisflokkar eru valdir fyrir auglýsinguna"
            />
          )}
          <OJOISelect
            isDisabled={!canEdit}
            width="half"
            label={formatMessage(messages.grunnvinnsla.categories)}
            options={categoryOptions}
            isValidating={isUpdatingCategory}
            value={latestSelectedCategory}
            onChange={(opt) => {
              if (!opt) {
                return toast.warning('Eitthvað fór úrskeiðis')
              }
              updateCategories({
                categoryIds: [opt.value],
              })
            }}
          />
          <Inline space={1} flexWrap="wrap">
            {currentCase.advertCategories?.map((category, i) => (
              <OJOITag
                disabled={!canEdit}
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
