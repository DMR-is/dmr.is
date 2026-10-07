import deepmerge from 'deepmerge'
import { useCallback, useEffect, useRef } from 'react'

import {
  CommonApplicationAnswers,
  RecallApplicationAnswers,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette-schemas'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { debounce } from '@dmr.is/utils-shared/lodash/debounce'

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

// Pending debounced localStorage writes per application, so navigation can
// flush them before reading localStorage
const pendingLocalFlushes = new Map<string, Set<() => void>>()

export const flushPendingLocalWrites = (applicationId: string) => {
  pendingLocalFlushes.get(applicationId)?.forEach((flush) => flush())
}

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
        const optimisticData = {
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

  const pendingLocalAnswers = useRef<UpdateApplicationAnswers<T> | null>(null)

  const writePendingLocal = useCallback(() => {
    const answers = pendingLocalAnswers.current
    pendingLocalAnswers.current = null
    if (answers) {
      updateLocalOnly(answers)
    }
  }, [updateLocalOnly])

  const debounceLocalHandler = useCallback(debounce(writePendingLocal, 200), [
    writePendingLocal,
  ])

  // Merge into the pending write instead of replacing it, so a quick second
  // call (e.g. onChange then onBlur) can't drop the first one
  const debouncedUpdateApplicationLocalOnly = useCallback(
    (answers: UpdateApplicationAnswers<T>) => {
      pendingLocalAnswers.current = pendingLocalAnswers.current
        ? deepmerge<UpdateApplicationAnswers<T>>(
            pendingLocalAnswers.current,
            answers,
            { arrayMerge },
          )
        : answers
      return debounceLocalHandler()
    },
    [debounceLocalHandler],
  )

  useEffect(() => {
    const flush = () => {
      debounceLocalHandler.cancel()
      writePendingLocal()
    }
    const flushes = pendingLocalFlushes.get(id) ?? new Set<() => void>()
    flushes.add(flush)
    pendingLocalFlushes.set(id, flushes)

    return () => {
      // Write anything still pending when the field unmounts (step change)
      flush()
      flushes.delete(flush)
      if (flushes.size === 0) {
        pendingLocalFlushes.delete(id)
      }
    }
  }, [id, debounceLocalHandler, writePendingLocal])

  return {
    updateApplication,
    debouncedUpdateApplication,
    updateLocalOnly: debouncedUpdateApplicationLocalOnly,
    isUpdatingApplication,
  }
}
