import { ComponentProps } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'

import { Spinner } from '../spinner/Spinner'

type Props = ComponentProps<typeof Tag> & {
  closeable?: boolean
  isValidating?: boolean
}

export const OJOITag = ({
  closeable,
  children,
  isValidating,
  ...rest
}: Props) => {
  return (
    <Tag onClick={rest.onClick} disabled={isValidating} {...rest}>
      <Box
        opacity={isValidating ? 0.5 : 1}
        cursor="pointer"
        display="flex"
        alignItems="center"
        columnGap={1}
      >
        {children}
        {isValidating ? (
          <Spinner size="small" />
        ) : (
          <Icon size="small" icon="close" type="outline" />
        )}
      </Box>
    </Tag>
  )
}
