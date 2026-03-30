'use client'

import cn from 'classnames'
import React, { ElementType, FC, ReactElement } from 'react'

import type { Colors } from '@dmr.is/island-ui-theme'

import type { Size } from '@island.is/island-ui/core/IconRC/types'

import { Icon } from './Icon'
import * as styles from './Tooltip.css'

type Placement = 'top' | 'right' | 'bottom' | 'left'
type HorizontalAlign = 'start' | 'center' | 'end'

interface TooltipProps {
  placement?: Placement
  horizontalAlign?: HorizontalAlign
  text: React.ReactNode
  iconSize?: Size
  color?: Colors
  children?: ReactElement
  fullWidth?: boolean
  as?: ElementType
}

export const Tooltip: FC<React.PropsWithChildren<TooltipProps>> = ({
  placement = 'top',
  horizontalAlign = 'center',
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
          styles.horizontalAlign[horizontalAlign],
          fullWidth && styles.fullWidth,
        )}
        role="tooltip"
      >
        {text}
      </div>
    </Component>
  )
}
