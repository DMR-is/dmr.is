import addDays from 'date-fns/addDays'
import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AdvertVersionEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { AdvertDetails } from '../lib/trpc/types'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type PublicationFunction = 'create' | 'update' | 'delete'

const createOptimisticDataForPublication = (
  prevData: AdvertDetails,
  publicationFunction: PublicationFunction,
  updateData?:
    | {
        publicationId: string
        scheduledAt?: unknown
      }
    | undefined,
): AdvertDetails => {
  if (publicationFunction === 'delete') {
    return {
      ...prevData,
      publications: prevData.publications.filter(
        (publication) => publication.id !== updateData?.publicationId,
      ),
    }
  }

  if (publicationFunction === 'update') {
    const scheduledAt =
      updateData?.scheduledAt instanceof Date
        ? updateData.scheduledAt.toISOString()
        : typeof updateData?.scheduledAt === 'string'
          ? new Date(updateData.scheduledAt).toISOString()
          : undefined

    return {
      ...prevData,
      publications: prevData.publications.map((publication) =>
        publication.id === updateData?.publicationId
          ? {
              ...publication,
              scheduledAt: scheduledAt ?? publication.scheduledAt,
            }
          : publication,
      ),
    }
  }

  const versionMapping = {
    1: AdvertVersionEnum.A,
    2: AdvertVersionEnum.B,
    3: AdvertVersionEnum.C,
  }

  const version = prevData.publications.length
  const previousPublication = prevData.publications[version - 1]
  const scheduledAt = addDays(
    previousPublication ? new Date(previousPublication.scheduledAt) : new Date(),
    14,
  )
  const versionEnum =
    versionMapping[(version + 1) as keyof typeof versionMapping] ??
    AdvertVersionEnum.A

  const optimisticData: AdvertDetails = {
    ...prevData,
    publications: [
      ...prevData.publications,
      {
        id: 'fakeId',
        scheduledAt: scheduledAt.toISOString(),
        advertId: prevData.id,
        version: versionEnum,
        publishedAt: undefined,
        isLegacy: false,
      },
    ],
  }
  return optimisticData
}

export const useUpdatePublications = (id: string) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: createPublicationMutation } = useMutation(
    trpc.createPublication.mutationOptions({
      onMutate: async (_variables) => {
        await queryClient.cancelQueries(trpc.getAdvert.queryFilter({ id }))

        const prevData = queryClient.getQueryData<AdvertDetails>(
          trpc.getAdvert.queryKey({ id }),
        )

        if (!prevData) return

        const optimisticData = createOptimisticDataForPublication(
          prevData,
          'create',
        )

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id }),
          optimisticData,
        )

        return prevData
      },
      onSuccess: async () => {
        toast.success('Birting bætt við')
        await queryClient.invalidateQueries(trpc.getAdvert.queryFilter({ id }))
      },
      onError: (e, variables, mutateResults) => {
        toast.error('Ekki tókst að bæta við birtingu')
        queryClient.setQueryData(trpc.getAdvert.queryKey({ id }), mutateResults)
      },
    }),
  )

  const { mutate: updatePublicationMutation } = useMutation(
    trpc.updatePublication.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(trpc.getAdvert.queryFilter({ id }))
        const prevData = queryClient.getQueryData<AdvertDetails>(
          trpc.getAdvert.queryKey({ id }),
        )

        if (!prevData) return

        const optimisticData = createOptimisticDataForPublication(
          prevData,
          'update',
          variables,
        )

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id }),
          optimisticData,
        )

        await new Promise((resolve) => setTimeout(resolve, 2000))

        return prevData
      },
      onSuccess: async () => {
        toast.success('Birting uppfærð')
        await queryClient.invalidateQueries(trpc.getAdvert.queryFilter({ id }))
      },
      onError: (_, _variables, mutateResults) => {
        queryClient.setQueryData(trpc.getAdvert.queryKey({ id }), mutateResults)
        toast.error('Ekki tókst að uppfæra birtingu')
      },
    }),
  )

  const { mutate: deletePublicationMutation } = useMutation(
    trpc.deletePublication.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(trpc.getAdvert.queryFilter({ id }))
        const prevData = queryClient.getQueryData<AdvertDetails>(
          trpc.getAdvert.queryKey({ id }),
        )

        if (!prevData) return

        const optimisticData = createOptimisticDataForPublication(
          prevData,
          'delete',
          variables,
        )

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id }),
          optimisticData,
        )

        return prevData
      },
      onSuccess: async () => {
        toast.success('Birting fjarlægð')
        await queryClient.invalidateQueries(trpc.getAdvert.queryFilter({ id }))
      },
      onError: (_, _variables, mutateResults) => {
        queryClient.setQueryData(trpc.getAdvert.queryKey({ id }), mutateResults)
        toast.error('Ekki tókst að fjarlægja birtingu')
      },
    }),
  )

  const createPublication = useCallback(() => {
    return createPublicationMutation({ advertId: id })
  }, [id, createPublicationMutation])

  const updatePublication = useCallback(
    (publicationId: string, scheduledAt: string) => {
      return updatePublicationMutation({
        advertId: id,
        publicationId,
        scheduledAt: new Date(scheduledAt),
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

  return {
    createPublication,
    updatePublication,
    deletePublication,
  }
}
