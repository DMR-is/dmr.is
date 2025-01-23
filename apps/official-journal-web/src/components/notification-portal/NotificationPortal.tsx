import { createPortal } from 'react-dom'

import { Box } from '@island.is/island-ui/core'

import { NOTIFICATION_PORTAL_ID } from '../../lib/constants'

type Props = {
  children: React.ReactNode
}

export default function NotificationPortal({ children }: Props) {
  const portalRoot = document.getElementById(NOTIFICATION_PORTAL_ID)

  if (!portalRoot) {
    return null
  }

  return createPortal(<Box marginBottom={3}>{children}</Box>, portalRoot)
}
