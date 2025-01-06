// import { usePathname } from 'next/navigation'

import { Box, DropdownMenu } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { PagePaths } from '../../lib/constants'
import * as styles from './ControlPanel.css'
import { messages } from './messages'
export const ControlPanel = () => {
  const { formatMessage } = useFormatMessage()
  // const pathBranch = usePathname().split('/')[1]

  // const activePath = PagePaths.find(
  //   (path) => path.pathname === `/${pathBranch}`,
  // )

  const paths = PagePaths.sort((a, b) => a.order - b.order).map((path) => {
    return {
      title: path.title,
      href: path.pathname,
    }
  })

  return (
    <Box className={styles.controlPanel}>
      <div className={styles.controlPanelWrapper}>
        <div>
          <div className={styles.controlPanelTitle}>
            {formatMessage(messages.general.controlPanelProject)}
          </div>
        </div>
        <DropdownMenu
          icon="chevronDown"
          // title={activePath?.title}
          title="Stjórnborð"
          items={paths}
        />
      </div>
    </Box>
  )
}
