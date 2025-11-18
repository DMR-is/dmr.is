import React from 'react'

import { Tag } from '@dmr.is/ui/components/island-is'

import { StatusDto, StatusEnum } from '../../gen/fetch'

type Props = {
  status: StatusDto
}

export const StatusTag = ({ status }: Props) => {
  let variant: React.ComponentProps<typeof Tag>['variant'] = 'purple'

  switch (status.title) {
    case StatusEnum.Innsent:
      variant = 'purple'
      break
    case StatusEnum.ÍVinnslu:
      variant = 'blue'
      break
    case StatusEnum.TilbúiðTilÚtgáfu:
      variant = 'blueberry'
      break
    case StatusEnum.Afturkallað:
    case StatusEnum.Hafnað:
      variant = 'rose'
      break
    case StatusEnum.ÚTgefið:
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
