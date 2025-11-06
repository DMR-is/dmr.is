'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is'

type Props = {
  title: string
  message?: string
}

export const ApplicationError = ({ title, message }: Props) => {
  return <AlertMessage type="error" title={title} message={message} />
}
