'use client'

import cn from 'classnames'
import React, { ElementType, FC, ReactElement } from 'react'

import { Icon } from '@island.is/island-ui/core/IconRC/Icon'
import type { Size } from '@island.is/island-ui/core/IconRC/types'
import type { Colors } from '@dmr.is/island-ui-theme'

import * as styles from './Tooltip.css'

type Placement = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  placement?: Placement
  text: React.ReactNode
  iconSize?: Size
  color?: Colors
  children?: ReactElement
  fullWidth?: boolean
  as?: ElementType
}

export const Tooltip: FC<React.PropsWithChildren<TooltipProps>> = ({
  placement = 'top',
  text,
  iconSize = 'small',
  color = 'dark200',
  children,
  as: Component = 'span',
  fullWidth,
}) => {
  if (!text) {
    return null
  }

  return (
    <Component className={styles.container} tabIndex={0}>
      {children ?? (
        <Icon icon="informationCircle" color={color} size={iconSize} />
      )}
      <div
        className={cn(
          styles.tooltipContent,
          styles.placement[placement],
          fullWidth && styles.fullWidth,
        )}
        role="tooltip"
      >
        {text}
      </div>
    </Component>
  )
}
