'use client'

import { AlertMessage } from '@island.is/island-ui/core'

type Props = {
  id: string
}

export const ApplicationNotFound = ({ id }: Props) => {
  return (
    <AlertMessage
      type="warning"
      title="Mál fannst ekki"
      message={`Mál með auðkenni ${id} fannst ekki eða er ekki til staðar.`}
    />
  )
}
