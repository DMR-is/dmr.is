import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  CommonApplicationAnswers,
  RecallApplicationAnswers,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette/schemas'
import { toast } from '@dmr.is/ui/components/island-is'

import { ApplicationDetailedDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

type UpdateApplicationMutationOptions = {
  successMessage?: string
  errorMessage?: string
  silent?: boolean
}

export type UpdateApplicationJsonType = 'COMMON' | 'RECALL'

type UpdateApplicationAnswers<T extends UpdateApplicationJsonType> =
  T extends 'COMMON' ? CommonApplicationAnswers : RecallApplicationAnswers

type UseUpdateApplicationJSONParams<T extends UpdateApplicationJsonType> = {
  id: string
  type: T
}

export const useUpdateApplicationJson = <T extends UpdateApplicationJsonType>({
  id,
  type,
}: UseUpdateApplicationJSONParams<T>) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: application } = useSuspenseQuery(
    trpc.getApplicationById.queryOptions({ id: id }),
  )
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
    }),
  )

  const updateApplicationJson = useCallback(
    (
      answers: UpdateApplicationAnswers<T>,
      options?: UpdateApplicationMutationOptions,
    ) => {
      const body = {
        id: id,
        type: type,
        answers: answers,
      }

      const parsed = updateApplicationWithIdInput.parse(body)

      return updateApplicationMutation(parsed, {
        onSuccess: () => {
          if (options?.successMessage && !options.silent) {
            toast.success(options.successMessage, {
              toastId: options.successMessage,
            })
          }

          queryClient.invalidateQueries(
            trpc.getApplicationById.queryFilter({
              id,
            }),
          )
        },
        onError: (_error, _variables, onMutateResult) => {
          if (options?.errorMessage && !options.silent) {
            toast.error(options.errorMessage, { toastId: options.errorMessage })
          }

          if (onMutateResult) {
            queryClient.setQueryData(
              trpc.getApplicationById.queryKey({
                id,
              }),
              onMutateResult,
            )
          }
        },
      })
    },
    [application.answers],
  )

  const debouncedHandler = useCallback(
    debounce(
      (
        answers: UpdateApplicationAnswers<T>,
        options?: UpdateApplicationMutationOptions,
      ) => updateApplicationJson(answers, options),
      500,
    ),
    [application.answers],
  )

  const debouncedUpdateApplicationJson = useCallback(
    (
      answers: UpdateApplicationAnswers<T>,
      options?: UpdateApplicationMutationOptions,
    ) => {
      debouncedHandler.cancel()
      return debouncedHandler(answers, options)
    },
    [debouncedHandler],
  )

  return {
    updateApplicationJson,
    debouncedUpdateApplicationJson,
    isUpdatingApplication,
  }
}
