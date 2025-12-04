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

export type UpdateApplicationType = 'COMMON' | 'RECALL'

type UpdateApplicationAnswers<T extends UpdateApplicationType> =
  T extends 'COMMON' ? CommonApplicationAnswers : RecallApplicationAnswers

type UseUpdateApplicationParams<T extends UpdateApplicationType> = {
  id: string
  type: T
}

export const useUpdateApplication = <T extends UpdateApplicationType>({
  id,
  type: _type,
}: UseUpdateApplicationParams<T>) => {
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

  const updateApplication = useCallback(
    (
      answers: UpdateApplicationAnswers<T>,
      options?: UpdateApplicationMutationOptions,
    ) => {
      const body = {
        id: id,
        type: application.type,
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
      ) => updateApplication(answers, options),
      500,
    ),
    [application.answers],
  )

  const debouncedUpdateApplication = useCallback(
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
    updateApplication,
    debouncedUpdateApplication,
    isUpdatingApplication,
  }
}
