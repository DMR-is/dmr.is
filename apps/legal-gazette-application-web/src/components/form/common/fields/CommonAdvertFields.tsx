'use client'

import { isBase64 } from 'class-validator'
import { useEffect } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  CommonApplicationInputFields,
  CommonApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../../hooks/useUpdateApplicationJson'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { Editor } from '../../../editor/Editor'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const trpc = useTRPC()
  const { getValues, setValue, watch } =
    useFormContext<CommonApplicationWebSchema>()
  const formState = useFormState()
  const metadata = getValues('metadata')

  const fields = watch('fields')

  const defaultHTML = isBase64(fields?.html)
    ? Buffer.from(fields?.html ?? '', 'base64').toString('utf-8')
    : (fields?.html ?? '')

  const { updateApplicationJson, debouncedUpdateApplicationJson } =
    useUpdateApplicationJson({
      id: metadata.applicationId,
      type: ApplicationTypeEnum.COMMON,
    })

  const {
    data: categoriesData,
    isLoading,
    isPending,
  } = useQuery(
    trpc.getCategories.queryOptions(
      { typeId: fields?.typeId ?? undefined },
      { enabled: !!fields?.typeId },
    ),
  )

  useEffect(() => {
    if (!categoriesData?.categories || !formState.isDirty) return

    if (categoriesData?.categories.length === 1) {
      setValue('fields.categoryId', categoriesData.categories[0].id)

      return updateApplicationJson(
        {
          fields: { categoryId: categoriesData.categories[0].id },
        },
        {
          successMessage: 'Flokkur vistaður',
          errorMessage: 'Ekki tókst að vista flokk',
          silent: true,
        },
      )
    }

    setValue('fields.categoryId', null)
    return updateApplicationJson(
      { fields: { categoryId: null } },
      {
        successMessage: 'Flokkur vistaður',
        errorMessage: 'Ekki tókst að vista flokk',
        silent: true,
      },
    )
  }, [categoriesData?.categories, formState.isDirty])

  const categoryOptions =
    categoriesData?.categories.map((category) => ({
      label: category.title,
      value: category.id,
    })) ?? []

  const disabledCategories =
    categoryOptions.length === 0 ||
    categoryOptions.length === 1 ||
    isLoading ||
    isPending

  return (
    <Stack space={[1, 2]}>
      <Text variant="h4">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            options={metadata.typeOptions}
            name={'fields.typeId'}
            label="Tegund auglýsingar"
            onChange={(val) =>
              updateApplicationJson(
                { fields: { typeId: val } },
                {
                  successMessage: 'Tegund auglýsingar vistuð',
                  errorMessage: 'Ekki tókst að vista tegund auglýsingar',
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            disabled={disabledCategories}
            options={categoryOptions}
            name={'fields.categoryId'}
            label="Flokkur"
            onChange={(val) =>
              updateApplicationJson(
                { fields: { categoryId: val } },
                {
                  successMessage: 'Flokkur vistaður',
                  errorMessage: 'Ekki tókst að vista flokk',
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            name={CommonApplicationInputFields.CAPTION}
            label="Yfirskrift"
            required
            onChange={(val) =>
              debouncedUpdateApplicationJson(
                { fields: { caption: val } },
                {
                  successMessage: 'Yfirskrift vistuð',
                  errorMessage: 'Ekki tókst að vista yfirskrift',
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span="12/12">
          <Text marginBottom={1} variant="h4">
            Meginmál
          </Text>
          <Editor
            defaultValue={defaultHTML}
            onChange={(val) =>
              debouncedUpdateApplicationJson(
                { fields: { html: Buffer.from(val).toString('base64') } },
                {
                  successMessage: 'Meginmál vistað',
                  errorMessage: 'Ekki tókst að vista meginmál',
                },
              )
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
