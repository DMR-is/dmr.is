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

  useEffect(() => {
    if (!isClient) return

    if (containerRef.current) {
      setContainerHeight(activeHeight)
    }
  }, [isActive, isClient, activeHeight])

  useEffect(() => {
    if (!isClient) return

    if (containerRef.current) {
      setContainerWidth(activeWidth)
    }
  }, [isComplete, isActive, activeWidth, isClient])

  return (
    <Box
      ref={containerRef}
      className={styles.container}
      style={{
        marginLeft: isSmallScreen && isComplete ? `-${containerWidth}px` : '0',
      }}
    >
      <Box display="flex" alignItems="center" marginBottom={[0, 0, 1]}>
        <Box paddingTop={[0, 0, 2]}>
          <SectionNumber
            theme={theme}
            lineHeight={containerHeight}
            currentState={
              isActive ? 'active' : isComplete ? 'previous' : 'next'
            }
            number={sectionIndex + 1}
          />
        </Box>
        <Box
          paddingTop={[0, 0, 2]}
          paddingRight={[2, 2, 0]}
          width="full"
          className={cn(styles.name, {
            [styles.nameWithActiveSubSections]: subSections && isActive,
          })}
        >
          <Text lineHeight="lg" fontWeight={isActive ? 'semiBold' : 'light'}>
            {section}
          </Text>
        </Box>
      </Box>
      {isSmallScreen || !subSections ? null : (
        <SubSections isActive={isActive} subSections={subSections} />
      )}
    </Box>
  )
}
