import React from 'react'

import { Tag } from '@dmr.is/ui/components/island-is'

import { StatusDto } from '../../gen/fetch'
import { StatusEnum } from '../../lib/constants'

type Props = {
  status: StatusDto
}

export const StatusTag = ({ status }: Props) => {
  let variant: React.ComponentProps<typeof Tag>['variant'] = 'purple'

  switch (status.title) {
    case StatusEnum.SUBMITTED:
      variant = 'purple'
      break
    case StatusEnum.IN_PROGRESS:
      variant = 'blue'
      break
    case StatusEnum.READY_FOR_PUBLICATION:
      variant = 'blueberry'
      break
    case StatusEnum.REVOKED:
    case StatusEnum.REJECTED:
      variant = 'rose'
      break
    case StatusEnum.PUBLISHED:
      variant = 'mint'
      break
    default:
      variant = 'purple'
  }

  return (
    <Tag disabled variant={variant}>
      {status.title}
    </Tag>
  )
}
