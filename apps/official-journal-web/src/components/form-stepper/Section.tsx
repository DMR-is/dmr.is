import cn from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import { useWindowSize } from 'react-use'
import useComponentSize from '@rehooks/component-size'

import { Box, Text } from '@island.is/island-ui/core'
import { theme as islandUITheme } from '@island.is/island-ui/theme'

import { SectionNumber } from './SectionNumber/SectionNumber'
import { SubSections } from './SubSectionsV2/SubSectionsV2'
import * as styles from './Section.css'
import * as types from './types'

export const Section: FC<
  React.PropsWithChildren<{
    theme?: types.FormStepperThemes
    section: string
    subSections?: Array<React.ReactNode>
    sectionIndex: number
    isActive?: boolean
    isComplete?: boolean
  }>
> = ({
  theme = types.FormStepperThemes.PURPLE,
  section,
  subSections,
  sectionIndex,
  isActive = false,
  isComplete = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { height: activeHeight, width: activeWidth } =
    useComponentSize(containerRef)
  const { width } = useWindowSize()
  const [containerHeight, setContainerHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const isClient = typeof window === 'object'
  const isSmallScreen = width <= islandUITheme.breakpoints.md

  return (
    <Box
      ref={containerRef}
      className={styles.container}
      style={{
        marginLeft: isSmallScreen && isComplete ? `-${containerWidth}px` : '0',
      }}
    ></Box>
  )
}
