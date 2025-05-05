import { toast as toaster } from '@island.is/island-ui/core'

export const toast = {
  success: (message: string) => {
    toaster.success(message, {
      toastId: `${message}`,
    })
  },
  error: (message: string) => {
    toaster.error(message, {
      toastId: `${message}`,
    })
  },
  warning: (message: string) => {
    toaster.warning(message, {
      toastId: `${message}`,
    })
  },
}
