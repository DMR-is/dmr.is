import cn from 'classnames'
import { FC } from 'react'

import { Box } from '@island.is/island-ui/core'

import * as styles from './SectionNumberColumn.css'

interface SectionNumberColumnProps {
  children?: React.ReactNode
  type?: 'section' | 'subSection'
}

export const SectionNumberColumn: FC<
  React.PropsWithChildren<SectionNumberColumnProps>
> = ({ children, type = 'section' }) => (
  <Box
    position="relative"
    display="flex"
    alignItems="center"
    justifyContent="center"
    marginRight={[1, 1, 2]}
    className={cn(styles.root, {
      [styles.rootSubSection]: type === 'subSection',
    })}
  >
    {children}
  </Box>
)
