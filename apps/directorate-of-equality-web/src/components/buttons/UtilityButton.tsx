import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'

type UtilityButtonProps = Pick<
  React.ComponentProps<typeof Button>,
  'icon' | 'iconType' | 'onClick' | 'children' | 'loading'
> & {
  backgroundColor?: React.ComponentProps<typeof Box>['background']
}

export const UtilityButton = ({
  backgroundColor = 'white',
  ...buttonProps
}: UtilityButtonProps) => {
  return (
    <Box borderRadius="md" background={backgroundColor}>
      <Button variant="utility" {...buttonProps} />
    </Box>
  )
}
