import { ComponentProps } from 'react'

import { Box, Icon, Tag } from '@island.is/island-ui/core'

type Props = ComponentProps<typeof Tag> & {
  closeable?: boolean
}

export const OJOITag = ({ closeable, children, ...rest }: Props) => {
  return (
    <Tag {...rest}>
      <Box
        cursor="pointer"
        display="flex"
        alignItems="center"
        columnGap={1}
        onClick={rest.onClick}
      >
        {children}
        <Icon size="small" icon="close" type="outline" />
      </Box>
    </Tag>
  )
}
