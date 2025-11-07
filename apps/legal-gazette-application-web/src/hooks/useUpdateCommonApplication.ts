import { useCallback } from 'react'

import { CommonApplicationFieldsDto } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'
import { UpdateOptions, useUpdateApplication } from './useUpdateApplication'

export const useUpdateCommonApplication = (applicationId: string) => {
  const { data: application } = trpc.applicationApi.getApplicationById.useQuery(
    { id: applicationId },
    { enabled: !!applicationId },
  )
  const { updateApplication } = useUpdateApplication(applicationId)

  const updateCommonApplication = useCallback(
    (data: CommonApplicationFieldsDto, options: UpdateOptions) => {
      updateApplication(
        { commonFields: data },
        {
          successMessage: options.successMessage,
          errorMessage: options.errorMessage,
        },
      )
    },
    [applicationId, updateApplication],
  )

  const updateType = useCallback(
    (typeId?: string) => {
      if (!typeId || typeId === application?.commonFields.typeId) {
        return
      }

      updateApplication(
        { commonFields: { typeId: typeId } },
        {
          successMessage: 'Tegund vistuð',
          errorMessage: 'Ekki tókst að uppfæra tegund',
        },
      )
    },
    [updateApplication, application?.commonFields.typeId],
  )

  const updateCategory = useCallback(
    (categoryId?: string) => {
      if (!categoryId || categoryId === application?.commonFields.categoryId) {
        return
      }

      updateApplication(
        { commonFields: { categoryId: categoryId } },
        {
          successMessage: 'Flokkur vistaður',
          errorMessage: 'Ekki tókst að uppfæra flokk',
        },
      )
    },
    [updateApplication, application?.commonFields.categoryId],
  )

  const updateCaption = useCallback(
    (caption: string) => {
      if (caption === application?.commonFields.caption) {
        return
      }

      updateApplication(
        { commonFields: { caption: caption } },
        {
          successMessage: 'Yfirskrift vistuð',
          errorMessage: 'Ekki tókst að uppfæra yfirskrift',
        },
      )
    },
    [updateApplication, application?.commonFields.caption],
  )

  const updateHTML = useCallback(
    (html: string) => {
      const asBase64 = Buffer.from(html).toString('base64')

      if (asBase64 === application?.commonFields.html) {
        return
      }

      updateApplication(
        { commonFields: { html: asBase64 } },
        {
          successMessage: 'Meginmál vistað',
          errorMessage: 'Ekki tókst að uppfæra meginmál',
        },
      )
    },
    [updateApplication, application?.commonFields.html],
  )

  return {
    updateCommonApplication,
    updateType,
    updateCategory,
    updateCaption,
    updateHTML,
  }
}
