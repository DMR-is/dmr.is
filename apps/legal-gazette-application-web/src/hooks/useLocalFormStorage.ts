import deepmerge from 'deepmerge'
import { useCallback } from 'react'

import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('useLocalFormStorage')

const STORAGE_KEY_PREFIX = 'lg-application-form-'

type StoredFormData = Record<string, unknown>

/**
 * Custom merge function for deepmerge that replaces arrays instead of merging them.
 * This matches the server-side behavior where arrays like companies, publishingDates,
 * and communicationChannels are replaced entirely, not concatenated.
 */
const arrayMerge = (_destinationArray: unknown[], sourceArray: unknown[]) =>
  sourceArray

/**
 * Hook for managing form data in localStorage with application ID scoping.
 * Used to persist form changes locally between server syncs.
 *
 * @param applicationId - The unique identifier for the application
 * @returns Object with load, save, clear, and merge functions
 */
export const useLocalFormStorage = (applicationId: string) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${applicationId}`

  /**
   * Load stored form data from localStorage.
   * Returns null if not found or if localStorage is unavailable.
   */
  const loadFromStorage = useCallback((): StoredFormData | null => {
    try {
      if (typeof window === 'undefined') {
        return null
      }

      const stored = localStorage.getItem(storageKey)
      if (!stored) {
        return null
      }

      const parsed = JSON.parse(stored) as StoredFormData
      logger.debug('Loaded form data from localStorage', {
        applicationId,
        keys: Object.keys(parsed),
      })
      return parsed
    } catch (error) {
      logger.error('Failed to load from localStorage', {
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }, [storageKey, applicationId])

  /**
   * Save form data to localStorage with deep merge.
   * Merges incoming data with existing stored data to preserve all fields.
   *
   * @param data - Partial form data to save
   */
  const saveToStorage = useCallback(
    (data: StoredFormData) => {
      try {
        if (typeof window === 'undefined') {
          return
        }

        const existing = loadFromStorage() || {}
        const merged = deepmerge(existing, data, { arrayMerge })

        localStorage.setItem(storageKey, JSON.stringify(merged))
        logger.debug('Saved form data to localStorage', {
          applicationId,
          keys: Object.keys(data),
        })
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'QuotaExceededError'
        ) {
          logger.warn('localStorage quota exceeded', { applicationId })
        } else {
          logger.error('Failed to save to localStorage', {
            applicationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    },
    [storageKey, loadFromStorage, applicationId],
  )

  /**
   * Clear all stored data for this application.
   * Call this after successful server sync or submission.
   */
  const clearStorage = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        return
      }

      localStorage.removeItem(storageKey)
      logger.debug('Cleared localStorage', { applicationId })
    } catch (error) {
      logger.error('Failed to clear localStorage', {
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [storageKey, applicationId])

  /**
   * Get form data merged with localStorage.
   * localStorage data wins in conflicts (latest local changes take precedence).
   *
   * @param currentData - Current form data to merge with localStorage
   * @returns Merged data with localStorage taking precedence
   */
  const getMergedData = useCallback(
    <T extends StoredFormData>(currentData: T): T => {
      const stored = loadFromStorage()
      if (!stored) {
        return currentData
      }

      // Deep merge: localStorage data takes precedence over current data
      const merged = deepmerge(currentData, stored, { arrayMerge }) as T

      logger.debug('Merged form data with localStorage', {
        applicationId,
        currentKeys: Object.keys(currentData),
        storedKeys: Object.keys(stored),
      })

      return merged
    },
    [loadFromStorage, applicationId],
  )

  /**
   * Check if there are unsaved local changes.
   */
  const hasLocalChanges = useCallback((): boolean => {
    return loadFromStorage() !== null
  }, [loadFromStorage])

  return {
    loadFromStorage,
    saveToStorage,
    clearStorage,
    getMergedData,
    hasLocalChanges,
  }
}
