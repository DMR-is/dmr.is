'use client'
import { isNotEmpty } from 'class-validator'
import Kennitala from 'kennitala'
import get from 'lodash/get'
import { useCallback, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import * as z from 'zod'

import {
  companySchema,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
  Button,
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useUpdateApplication } from '../../hooks/useUpdateApplication'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

export const CompanyLookup = () => {
  const trpc = useTRPC()
  const { watch, setValue, getValues, formState } =
    useFormContext<RecallApplicationWebSchema>()
  const { updateApplication } = useUpdateApplication({
    type: 'RECALL',
    id: getValues('metadata.applicationId'),
  })
  const [inputError, setInputError] = useState<string | undefined>(undefined)
  const [lookupResults, setLookupResults] = useState<
    z.infer<typeof companySchema>
  >({ companyName: '', companyNationalId: '' })
  const companies = watch('fields.settlementFields.companies', []) as z.infer<
    typeof companySchema
  >[]

  const { mutate, isPending } = useMutation(
    trpc.getCompanyByNationalId.mutationOptions({
      onMutate: () => {
        if (inputError) {
          setInputError(undefined)
        }
      },
      onSuccess: (legalEntity) => {
        const isIncluded = companies.find(
          (c) => c.companyNationalId === legalEntity.nationalId,
        )

        if (isIncluded) {
          setLookupResults({ companyName: '', companyNationalId: '' })
          toast.info(`Fyrirtækið ${legalEntity.name} er þegar skráð í búið.`)
          return
        }

        setLookupResults({
          companyNationalId: legalEntity.nationalId,
          companyName: legalEntity.name,
        })
        toast.success(`Fyrirtækið ${legalEntity.name} hefur verið bætt við.`)
      },
      onError: (error, variables) => {
        const message =
          error.data?.code === 'NOT_FOUND'
            ? `Ekkert fyrirtæki fannst með kennitölu ${variables.nationalId}.`
            : 'Villa kom upp við að sækja fyrirtæki.'

        toast.error(message)
      },
    }),
  )

  const isValidLookupResults = useCallback(() => {
    if (!lookupResults) return false

    if (!Kennitala.isCompany(lookupResults.companyNationalId)) {
      return false
    }

    if (!lookupResults.companyName || lookupResults.companyName.length === 0) {
      return false
    }

    return true
  }, [lookupResults])

  const clearInput = useCallback(() => {
    setInputError(undefined)
    setLookupResults({ companyName: '', companyNationalId: '' })
  }, [setInputError, setLookupResults])

  const onAddCompany = useCallback(() => {
    if (!lookupResults) return

    const isIncluded = companies.find(
      (c) => c.companyNationalId === lookupResults.companyNationalId,
    )

    if (isIncluded) {
      toast.info(
        `Fyrirtækið ${lookupResults.companyName} er þegar skráð í búið.`,
      )
      return
    }

    setValue('fields.settlementFields.companies', [
      ...companies,
      {
        companyNationalId: lookupResults.companyNationalId,
        companyName: lookupResults.companyName,
      },
    ])

    updateApplication(
      {
        fields: {
          settlementFields: {
            companies: [
              ...companies,
              {
                companyNationalId: lookupResults.companyNationalId,
                companyName: lookupResults.companyName,
              },
            ],
          },
        },
      },
      {
        onSuccessCallback: clearInput,
        successMessage: `${lookupResults.companyName} bætt við bú.`,
        errorMessage: `Villa kom upp við að bæta ${lookupResults.companyName} við.`,
      },
    )
  }, [lookupResults, companies])

  const onRemoveCompany = useCallback(
    (companyNationalId: string) => {
      const updatedCompanies = companies.filter(
        (c) => c.companyNationalId !== companyNationalId,
      )

      setValue('fields.settlementFields.companies', updatedCompanies)

      updateApplication(
        {
          fields: {
            settlementFields: {
              companies: updatedCompanies,
            },
          },
        },
        {
          successMessage: 'Fyrirtæki fjarlægt úr búi.',
          errorMessage: 'Villa kom upp við að fjarlægja fyrirtæki.',
        },
      )
    },
    [companies],
  )

  const onChangeNationalId = (id: string) => {
    setLookupResults((prev) =>
      prev
        ? { ...prev, companyNationalId: id }
        : { companyNationalId: id, companyName: '' },
    )

    if (id.length === 10 && !Kennitala.isCompany(id)) {
      setInputError('Kennitala er ekki gild')
    }

    if (Kennitala.isCompany(id)) {
      toast.info('Leita að fyrirtæki með kennitölu: ' + id)
      mutate({ nationalId: id })
    }
  }

  const onChangeName = (name: string) => {
    setLookupResults((prev) =>
      prev
        ? { ...prev, companyName: name }
        : { companyNationalId: '', companyName: name },
    )
  }

  const fieldError = get(
    formState.errors,
    'fields.settlementFields.companies.message',
  )

  return (
    <div id="fields.settlementFields.companies">
      <Stack space={[2, 3]}>
        {isNotEmpty(fieldError) && (
          <AlertMessage
            type="error"
            title="Samlagsfélög dánarbús vantar"
            message={fieldError as string}
          />
        )}
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <Text variant="h4">Samlagsfélög dánarbús</Text>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              errorMessage={inputError}
              name="company-lookup"
              label="Kennitala fyrirtækis"
              onChange={(e) => onChangeNationalId(e.target.value)}
              loading={isPending}
              size="sm"
              backgroundColor="blue"
              value={lookupResults?.companyNationalId}
              maxLength={10}
              buttons={[
                {
                  label: 'Hreinsa val',
                  name: 'close',
                  onClick: clearInput,
                },
              ]}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              name="company-name"
              label="Nafn fyrirtækis"
              value={lookupResults?.companyName}
              size="sm"
              backgroundColor="blue"
              onChange={(e) => onChangeName(e.target.value)}
              buttons={[
                {
                  label: 'Bæta við',
                  name: 'add',
                  onClick: onAddCompany,
                  disabled: !isValidLookupResults(),
                },
              ]}
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <DataTable
              noDataMessage="Engin fyrirtæki skráð, sláðu inn kennitölu fyrirtækis hér fyrir ofan til að bæta því við."
              columns={[
                {
                  field: 'companyNationalId',
                  children: 'Kennitala',
                  size: 'tiny',
                },
                {
                  field: 'companyName',
                  children: 'Nafn fyrirtækis',
                },
                {
                  field: 'actions',
                  children: undefined,
                  size: 'tiny',
                },
              ]}
              rows={companies.map((c) => ({
                companyName: c.companyName,
                companyNationalId: c.companyNationalId,
                actions: (
                  <Button
                    circle
                    icon="trash"
                    colorScheme="destructive"
                    onClick={() => onRemoveCompany(c.companyNationalId)}
                  />
                ),
              }))}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </div>
  )
}
