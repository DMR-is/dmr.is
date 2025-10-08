/* eslint-disable no-console */
'use client'

import React from 'react'

import {
  toast as islandisToast,
  ToastContainer as IslandToastContainer,
} from '@island.is/island-ui/core'

export const ToastContainer = (
  props: React.ComponentProps<typeof IslandToastContainer>,
) => {
  const originalConsoleError = console.error

  console.error = (...args) => {
    const culprit = args?.[1]

    if (culprit === 'ToastContainer') {
      // Swallow the error
      return
    }

    originalConsoleError(...args)
  }

  return <IslandToastContainer {...props} />
}

export const toast = islandisToast
