import { useCallback, useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/utils/toast'
import { debounce } from '@dmr.is/utils-shared/lodash/debounce'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { createOptions } from '../../lib/utils'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import { OJOITag } from '../tags/OJOITag'

import { useMutation } from '@tanstack/react-query'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const CommonFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()
  const trpc = useTRPC()

  const {
    currentCase,
    refetch,
    departmentOptions,
    categoryOptions,
    canEdit,
    handleOptimisticUpdate,
    isPublishedOrRejected,
  } = useCaseContext()
  const [mainTypeId, setMainTypeId] = useState<string | undefined>(
    currentCase.advertType?.mainType?.id,
  )

  const { data: mainTypesData, isLoading: isLoadingMainTypes } = useQuery({
    ...trpc.getMainTypes.queryOptions({
      page: 1,
      pageSize: 500,
      department: currentCase.advertDepartment.id,
    }),
    refetchOnWindowFocus: false,
  })

  const { data: typesData, isLoading: isLoadingTypes } = useQuery({
    ...trpc.getTypes.queryOptions({
      page: 1,
      pageSize: 500,
      department: currentCase.advertDepartment.id,
      mainType: mainTypeId,
    }),
    refetchOnWindowFocus: false,
  })

  const mainTypeOptions = mainTypesData?.mainTypes?.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  const typeOptions = typesData?.types?.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  const updateDepartmentMutation = useMutation(
    trpc.updateDepartment.mutationOptions({
      onSuccess: () => {
        toast.success(`Deild auglýsingar uppfærð`)
        refetch()
      },
      onError: () => {
        toast.error(`Ekki tókst að uppfæra deild auglýsingar`)
      },
    }),
  )

  const updateInvolvedPartyMutation = useMutation(
    trpc.updateInvolvedParty.mutationOptions({
      onSuccess: () => {
        toast.success(`Innsendandi uppfærður`)
        refetch()
      },
      onError: () => {
        toast.error(`Ekki tókst að uppfæra innsendanda`)
      },
    }),
  )

  const { data: availableParties, isLoading: isLoadingParties } = useQuery(
    trpc.getAvailableInvolvedParties.queryOptions({
      caseId: currentCase.id,
    }),
  )

  const institutionOptions = useMemo(
    () => createOptions(availableParties?.institutions ?? []),
    [availableParties?.institutions],
  )

  const updateTypeMutation = useMutation(
    trpc.updateCaseType.mutationOptions({
      onError: () => {
        toast.error(`Ekki tókst að uppfæra tegund auglýsingar`)
      },
      onSuccess: () => {
        toast.success(`Tegund auglýsingar uppfærð`)
        refetch()
      },
    }),
  )

  const updateCategoriesMutation = useMutation(
    trpc.updateCategories.mutationOptions({
      onError: () => {
        toast.error(`Ekki tókst að uppfæra efnisflokka auglýsingar`)
      },
      onSuccess: () => {
        toast.success(`Efnisflokkar auglýsingar uppfærðir`)
        refetch()
      },
    }),
  )

  const updateTitleMutation = useMutation(
    trpc.updateTitle.mutationOptions({
      onError: () => {
        toast.error(`Ekki tókst að uppfæra heiti auglýsingar`)
      },
      onSuccess: () => {
        toast.success(`Heiti auglýsingar uppfært`)
        refetch()
      },
    }),
  )

  const debounceUpdateTitle = useCallback(
    debounce((args: { title: string }) => {
      updateTitleMutation.mutate({ id: currentCase.id, ...args })
    }, 500),
    [currentCase.id],
  )

  const updateTitleHandler = (val: string) => {
    debounceUpdateTitle.cancel()
    debounceUpdateTitle({ title: val })
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
        {availableParties?.institutions &&
        availableParties.institutions.length > 1 ? (
          <OJOISelect
            isDisabled={!canEdit}
            width="half"
            name="institution"
            isLoading={isLoadingParties}
            isValidating={updateInvolvedPartyMutation.isPending}
            label={formatMessage(messages.grunnvinnsla.institution)}
            options={institutionOptions}
            value={institutionOptions.find(
              (opt) => opt.value === currentCase.involvedParty.id,
            )}
            onChange={(opt) => {
              if (!opt || !opt.value)
                return toast.warning('Eitthvað fór úrskeiðis')
              handleOptimisticUpdate(
                {
                  ...currentCase,
                  involvedParty: {
                    ...currentCase.involvedParty,
                    id: opt.value,
                    ...(availableParties?.institutions?.find(
                      (p) => p.id === opt.value,
                    ) || {}),
                  },
                },
                () =>
                  updateInvolvedPartyMutation.mutateAsync({
                    id: currentCase.id,
                    involvedPartyId: opt.value,
                  }),
              )
            }}
          />
        ) : (
          <OJOIInput
            disabled
            width="half"
            name="institution"
            loading={isLoadingParties}
            value={currentCase.involvedParty.title}
            label={formatMessage(messages.grunnvinnsla.institution)}
          />
        )}
        <OJOISelect
          isDisabled={!canEdit}
          width="half"
          name="department"
          isValidating={updateDepartmentMutation.isPending}
          label={formatMessage(messages.grunnvinnsla.department)}
          value={departmentOptions.find(
            (dep) => dep.value === currentCase.advertDepartment.id,
          )}
          options={departmentOptions}
          onChange={(opt) => {
            if (!opt) {
              return toast.warning('Eitthvað fór úrskeiðis')
            }
            handleOptimisticUpdate(
              {
                ...currentCase,
                advertDepartment: {
                  ...currentCase.advertDepartment,
                  id: opt.value,
                },
              },
              () =>
                updateDepartmentMutation.mutateAsync({
                  id: currentCase.id,
                  departmentId: opt.value,
                }),
            )
          }}
        />
        <OJOISelect
          isDisabled={!canEdit || !currentCase.advertDepartment.id}
          width="half"
          isValidating={isLoadingMainTypes}
          label={formatMessage(messages.grunnvinnsla.mainType)}
          options={mainTypeOptions}
          value={mainTypeOptions?.find(
            (t) => t.value === currentCase.advertType?.mainType?.id,
          )}
          onChange={(opt) => setMainTypeId(opt ? opt.value : '')}
        />
        <OJOISelect
          isDisabled={!canEdit || !mainTypeId}
          width="half"
          isLoading={isLoadingTypes}
          isValidating={updateTypeMutation.isPending}
          label={formatMessage(messages.grunnvinnsla.type)}
          options={typeOptions}
          value={typeOptions?.find(
            (t) => t.value === currentCase.advertType?.id,
          )}
          onChange={(opt) => {
            if (!opt) {
              return toast.warning('Eitthvað fór úrskeiðis')
            }
            handleOptimisticUpdate(
              {
                ...currentCase,
                advertType: { ...currentCase.advertType, id: opt.value },
              },
              () =>
                updateTypeMutation.mutateAsync({
                  id: currentCase.id,
                  typeId: opt.value,
                }),
            )
          }}
        />
        <OJOIInput
          disabled={!canEdit}
          textarea
          name="advertTitle"
          isValidating={updateTitleMutation.isPending}
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
            isValidating={updateCategoriesMutation.isPending}
            value={latestSelectedCategory}
            onChange={(opt) => {
              if (!opt) {
                return toast.warning('Eitthvað fór úrskeiðis')
              }
              updateCategoriesMutation.mutate({
                id: currentCase.id,
                categoryIds: [opt.value],
              })
            }}
          />
          <Inline space={1} flexWrap="wrap">
            {currentCase.advertCategories?.map((category) => (
              <OJOITag
                disabled={!canEdit}
                isValidating={updateCategoriesMutation.isPending}
                key={category.id}
                variant="blue"
                outlined
                closeable
                onClick={() =>
                  updateCategoriesMutation.mutate({
                    id: currentCase.id,
                    categoryIds: [category.id],
                  })
                }
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
