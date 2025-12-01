import { useCallback } from 'react'

import {
  CommonApplicationAnswers,
  RecallBankruptcyApplicationAnswers,
  RecallDeceasedApplicationAnswers,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette/schemas'

import { ApplicationDetailedDto, ApplicationTypeEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type UpdateApplicationAnswers<T extends ApplicationTypeEnum> =
  T extends ApplicationTypeEnum.COMMON
    ? CommonApplicationAnswers
    : T extends ApplicationTypeEnum.RECALLBANKRUPTCY
      ? RecallBankruptcyApplicationAnswers
      : T extends ApplicationTypeEnum.RECALLDECEASED
        ? RecallDeceasedApplicationAnswers
        : never

type UseUpdateApplicationJSONParams<T extends ApplicationTypeEnum> = {
  id: string
  type: T
}

export const useUpdateApplicationJson = <T extends ApplicationTypeEnum>({
  id,
  type,
}: UseUpdateApplicationJSONParams<T>) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {
    mutate: updateApplicationMutation,
    isPending: isUpdatingApplication,
  } = useMutation(
    trpc.updateApplication.mutationOptions({
      onMutate: async (variables) => {
        const { answers } = variables
        await queryClient.cancelQueries(
          trpc.getApplicationById.queryFilter({
            id: id,
          }),
        )

        const prevData = queryClient.getQueryData(
          trpc.getApplicationById.queryKey({
            id: id,
          }),
        )

        if (!prevData) return

        const optimisticData: ApplicationDetailedDto = {
          ...prevData,
          answers: {
            ...prevData?.answers,
            ...answers,
          },
        }

        queryClient.setQueryData(
          trpc.getApplicationById.queryKey({
            id: id,
          }),
          optimisticData,
        )

        return prevData
      },
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getApplicationById.queryFilter({
            id,
          }),
        )
      },
      onError: (_error, _variables, onMutateResult) => {
        if (onMutateResult) {
          queryClient.setQueryData(
            trpc.getApplicationById.queryKey({
              id,
            }),
            onMutateResult,
          )
        }
      },
    }),
  )

  const updateApplicationJson = useCallback(
    (
      answers: UpdateApplicationAnswers<T>,
      options?: Parameters<typeof updateApplicationMutation>[1],
    ) => {
      const body = {
        id: id,
        type: type,
        answers: answers,
      }

      const parsed = updateApplicationWithIdInput.parse(body)

      return updateApplicationMutation(parsed, options)
    },
    [type, id, updateApplicationMutation],
  )

  return {
    updateApplicationJson,
    isUpdatingApplication,
  }
}
