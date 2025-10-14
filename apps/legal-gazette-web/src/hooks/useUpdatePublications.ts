import addDays from 'date-fns/addDays'
import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is'

import { AdvertDetailedDto, AdvertVersionEnum } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type PublicationFunction = 'create' | 'update' | 'delete'

const createOptimisticDataForPublication = (
  prevData: AdvertDetailedDto,
  publicationFunction: PublicationFunction,
  updateData?:
    | {
        publicationId: string
        scheduledAt?: string
      }
    | undefined,
): AdvertDetailedDto => {
  if (publicationFunction === 'delete') {
    return {
      ...prevData,
      publications: prevData?.publications.filter(
        (publication) => publication.id !== updateData?.publicationId,
      ),
    }
  }

  if (publicationFunction === 'update') {
    return {
      ...prevData,
      publications: prevData?.publications.map((publication) =>
        publication.id === updateData?.publicationId
          ? {
              ...publication,
              scheduledAt: new Date(
                updateData.scheduledAt as string,
              ).toISOString(),
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

  const version = prevData?.publications.length
  const scheduledAt = addDays(
    new Date(prevData?.publications[version - 1].scheduledAt),
    14,
  )
  const versionEnum =
    versionMapping[(version + 1) as keyof typeof versionMapping]

  const optimisticData: AdvertDetailedDto = {
    ...prevData,
    publications: [
      ...(prevData?.publications || []),
      {
        id: 'fakeId',
        scheduledAt: scheduledAt.toISOString(),
        advertId: prevData.id,
        version: versionEnum,
        publishedAt: null,
        isLegacy: false,
      },
    ],
  }
  return optimisticData
}

export const useUpdatePublications = (id: string) => {
  const utils = trpc.useUtils()

  const { mutate: createPublicationMutation } =
    trpc.publications.createPublication.useMutation({
      onMutate: async (_variables) => {
        await utils.adverts.getAdvert.cancel({
          id,
        })
        const prevData = utils.adverts.getAdvert.getData({
          id,
        }) as AdvertDetailedDto

        const optimisticData = createOptimisticDataForPublication(
          prevData,
          'create',
        )

        utils.adverts.getAdvert.setData(
          {
            id,
          },
          optimisticData,
        )

        return prevData
      },
      onSuccess: async () => {
        toast.success('Birting bætt við')
        await utils.adverts.getAdvert.invalidate({
          id,
        })
      },
      onError: (e, variables, mutateResults) => {
        toast.error('Ekki tókst að bæta við birtingu')
        utils.adverts.getAdvert.setData(
          {
            id,
          },
          mutateResults,
        )
      },
    })

  const { mutate: updatePublicationMutation } =
    trpc.publications.updatePublication.useMutation({
      onMutate: async (variables) => {
        await utils.adverts.getAdvert.cancel({
          id,
        })
        const prevData = utils.adverts.getAdvert.getData({
          id,
        }) as AdvertDetailedDto

        const optimisticData = createOptimisticDataForPublication(
          prevData,
          'update',
          variables,
        )

        utils.adverts.getAdvert.setData(
          {
            id,
          },
          optimisticData,
        )

        await new Promise((resolve) => setTimeout(resolve, 2000))

        return prevData
      },
      onSuccess: async () => {
        toast.success('Birting uppfærð')
        await utils.adverts.getAdvert.invalidate({
          id,
        })
      },
      onError: (_, _variables, mutateResults) => {
        utils.adverts.getAdvert.setData(
          {
            id,
          },
          mutateResults,
        )
        toast.error('Ekki tókst að uppfæra birtingu')
      },
    })

  const { mutate: deletePublicationMutation } =
    trpc.publications.deletePublication.useMutation({
      onMutate: async (variables) => {
        await utils.adverts.getAdvert.cancel({
          id,
        })
        const prevData = utils.adverts.getAdvert.getData({
          id,
        }) as AdvertDetailedDto

        const optimisticData = createOptimisticDataForPublication(
          prevData,
          'delete',
          variables,
        )

        utils.adverts.getAdvert.setData(
          {
            id,
          },
          optimisticData,
        )

        return prevData
      },
      onSuccess: async () => {
        toast.success('Birting fjarlægð')
        await utils.adverts.getAdvert.invalidate({
          id,
        })
      },
      onError: (_, _variables, mutateResults) => {
        utils.adverts.getAdvert.setData(
          {
            id,
          },
          mutateResults,
        )
        toast.error('Ekki tókst að fjarlægja birtingu')
      },
    })

  const { mutate: publishPublicationMutation } =
    trpc.publications.publishPublication.useMutation({
      onSuccess: async () => {
        toast.success('Birting gefin út')
        await utils.adverts.getAdvert.invalidate({
          id,
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
