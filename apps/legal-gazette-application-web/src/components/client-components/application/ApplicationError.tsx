'use client'

import { AlertMessage } from '@island.is/island-ui/core'

type Props = {
  title: string
  message?: string
}

export const ApplicationError = ({ title, message }: Props) => {
  return <AlertMessage type="error" title={title} message={message} />
}
