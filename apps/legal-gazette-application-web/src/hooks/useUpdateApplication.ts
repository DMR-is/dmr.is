import deepmerge from 'deepmerge'
import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  CommonApplicationAnswers,
  RecallApplicationAnswers,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette/schemas'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ApplicationDetailedDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { useLocalFormStorage } from './useLocalFormStorage'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

/**
 * Custom merge function for deepmerge that replaces arrays instead of merging them.
 * This matches the server-side behavior where arrays like companies, publishingDates,
 * and communicationChannels are replaced entirely, not concatenated.
 */
const arrayMerge = (_destinationArray: unknown[], sourceArray: unknown[]) =>
  sourceArray

type UpdateApplicationMutationOptions = {
  onSuccessCallback?: () => void
  successMessage?: string
  errorMessage?: string
  silent?: boolean
}

export type UpdateApplicationType = 'COMMON' | 'RECALL'

export type UpdateApplicationAnswersWithoutStep<
  T extends UpdateApplicationType,
> = T extends 'COMMON' ? CommonApplicationAnswers : RecallApplicationAnswers

export type UpdateApplicationAnswers<T extends UpdateApplicationType> =
  UpdateApplicationAnswersWithoutStep<T> & { currentStep?: number }

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
  const { saveToStorage, clearStorage } = useLocalFormStorage(id)

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

        // FIX: Use deepmerge instead of shallow spread to preserve nested fields
        // This fixes the bug where updating a nested field (e.g., settlementFields.name)
        // would overwrite sibling fields (e.g., liquidatorName)
        const optimisticData: ApplicationDetailedDto = {
          ...prevData,
          answers: deepmerge(
            (prevData.answers || {}) as Record<string, unknown>,
            (answers || {}) as Record<string, unknown>,
            { arrayMerge },
          ),
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
        currentStep: answers.currentStep,
      }

      const parsed = updateApplicationWithIdInput.parse(body)

      return updateApplicationMutation(parsed, {
        onSuccess: () => {
          if (options?.successMessage && !options.silent) {
            toast.success(options.successMessage, {
              toastId: options.successMessage,
            })
          }

          options?.onSuccessCallback?.()
          clearStorage()

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

  /**
   * Update localStorage only without making a server call.
   * Also updates the React Query cache optimistically for immediate UI feedback.
   * Use this for field changes between navigation events.
   */
  const updateLocalOnly = useCallback(
    (answers: UpdateApplicationAnswersWithoutStep<T>) => {
      saveToStorage(answers as Record<string, unknown>)
    },
    [id, saveToStorage, queryClient, trpc],
  )

  const debounceLocalHandler = useCallback(
    debounce(
      (answers: UpdateApplicationAnswers<T>) => updateLocalOnly(answers),
      200,
    ),
    [updateLocalOnly],
  )

  const debouncedUpdateApplicationLocalOnly = useCallback(
    (answers: UpdateApplicationAnswers<T>) => {
      debounceLocalHandler.cancel()
      return debounceLocalHandler(answers)
    },
    [debounceLocalHandler],
  )

  return {
    updateApplication,
    debouncedUpdateApplication,
    updateLocalOnly: debouncedUpdateApplicationLocalOnly,
    isUpdatingApplication,
  }
}
