import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is'

import { GetAdvertPublicationVersionEnum } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type UpdateOptions = {
  successMessage?: string
  errorMessage?: string
}
export const useUpdatePublications = (id: string) => {
  const utils = trpc.useContext()

  const { mutate: createPublicationMutation } =
    trpc.publications.createPublication.useMutation({
      onSuccess: () => {
        toast.success('Birting bætt við')
        utils.publications.getPublication.invalidate({
          advertId: id,
          version: GetAdvertPublicationVersionEnum.A,
        })
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við birtingu')
      },
    })

  const { mutate: updatePublicationMutation } =
    trpc.publications.updatePublication.useMutation({
      onSuccess: () => {
        toast.success('Birting uppfærð')
        utils.publications.getPublication.invalidate({
          advertId: id,
          version: GetAdvertPublicationVersionEnum.A,
        })
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra birtingu')
      },
    })

  const { mutate: deletePublicationMutation } =
    trpc.publications.deletePublication.useMutation({
      onSuccess: () => {
        toast.success('Birting fjarlægð')
        utils.publications.getPublication.invalidate({
          advertId: id,
          version: GetAdvertPublicationVersionEnum.A,
        })
      },
      onError: (e) => {
        toast.error('Ekki tókst að fjarlægja birtingu')
      },
    })

  const { mutate: publishPublicationMutation } =
    trpc.publications.publishPublication.useMutation({
      onSuccess: () => {
        toast.success('Birting gefin út')
        utils.publications.getPublication.invalidate({
          advertId: id,
          version: GetAdvertPublicationVersionEnum.A,
        })
      },
      onError: () => {
        toast.error('Ekki tókst að gefa út birtingu')
      },
    })

  const createPublication = useCallback(() => {
    return createPublicationMutation({ advertId: id })
  }, [id, createPublicationMutation])

  const updatePublication = useCallback(
    (publicationId: string, scheduledAt: string) => {
      return updatePublicationMutation({
        advertId: id,
        publicationId,
        scheduledAt,
      })
    },
    [id, updatePublicationMutation],
  )

  const deletePublication = useCallback(
    (publicationId: string) => {
      return deletePublicationMutation({
        advertId: id,
        publicationId,
      })
    },
    [id, deletePublicationMutation],
  )

  const publishPublication = useCallback(
    (publicationId: string) => {
      return publishPublicationMutation({
        advertId: id,
        publicationId,
      })
    },
    [id, publishPublicationMutation],
  )

  return {
    createPublication,
    updatePublication,
    deletePublication,
    publishPublication,
  }
}
