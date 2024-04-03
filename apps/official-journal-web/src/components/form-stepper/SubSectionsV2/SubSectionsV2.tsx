import cn from 'classnames'
import { FC } from 'react'

import { Box } from '@island.is/island-ui/core'

import { SectionNumberColumn } from '../SectionNumberColumn/SectionNumberColumn'
import * as styles from './SubSectionsV2.css'

export const SubSections: FC<
  React.PropsWithChildren<{
    isActive?: boolean
    subSections?: React.ReactNodeArray
  }>
> = ({ isActive = false, subSections }) => {
  return (
    <Box
      className={cn(styles.subSectionContainer, {
        [styles.subSectionContainerHidden]: !isActive,
      })}
    >
      <Box className={styles.subSectionInnerContainer}>
        <ul className={styles.subSectionList}>
          {subSections?.map((subSection, i) => (
            <Box
              display="flex"
              alignItems="center"
              marginTop={[0, 0, 1]}
              component="li"
              key={`subSection-${i}`}
            >
              <SectionNumberColumn type="subSection" />
              {subSection}
            </Box>
          ))}
        </ul>
      </Box>
    </Box>
  )
}
