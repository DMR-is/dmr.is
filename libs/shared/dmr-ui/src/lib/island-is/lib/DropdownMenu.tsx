'use client'

import cn from 'classnames'
import React, { MouseEvent, ReactElement, useCallback, useEffect, useRef, useState } from 'react'

import { Box } from '@island.is/island-ui/core/Box/Box'
import { Button } from '@island.is/island-ui/core/Button/Button'
import type { ButtonProps } from '@island.is/island-ui/core/Button/types'
import { Icon } from '@island.is/island-ui/core/IconRC/Icon'

import * as styles from './DropdownMenu.css'

export interface DropdownMenuProps {
  menuLabel?: string
  items: {
    href?: string
    onClick?: (event: MouseEvent<HTMLElement>) => void
    title: string
    noStyle?: boolean
    icon?: ButtonProps['icon']
    iconType?: ButtonProps['iconType']
    render?: (
      element: ReactElement,
      index: number,
      className: string,
    ) => ReactElement
  }[]
  title?: string
  icon?: ButtonProps['icon']
  iconType?: ButtonProps['iconType']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disclosure?: ReactElement<any>
  menuClassName?: string
  openOnHover?: boolean
  loading?: boolean
  disabled?: boolean
}

export const DropdownMenu = ({
  menuLabel,
  items,
  title,
  icon,
  iconType,
  loading,
  disabled,
  disclosure,
  menuClassName,
  openOnHover = false,
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, close])

  const toggle = () => setIsOpen((prev) => !prev)

  const hoverProps = openOnHover
    ? {
        onMouseEnter: () => setIsOpen(true),
        onMouseLeave: () => setIsOpen(false),
      }
    : {}

  return (
    <div
      ref={containerRef}
      className={styles.menuContainer}
      {...hoverProps}
    >
      {disclosure ? (
        React.cloneElement(disclosure, {
          onClick: (e: MouseEvent<HTMLElement>) => {
            disclosure.props.onClick?.(e)
            toggle()
          },
          'aria-haspopup': 'menu',
          'aria-expanded': isOpen,
        })
      ) : (
        <Button
          variant="utility"
          icon={icon}
          iconType={iconType}
          loading={loading}
          disabled={disabled}
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          {title}
        </Button>
      )}

      {isOpen && (
        <div
          role="menu"
          aria-label={menuLabel}
          className={cn(styles.menu, menuClassName)}
        >
          {items.map((item, index) => {
            const render = item.render || ((el: ReactElement) => el)
            const className = cn({ [styles.menuItem]: !item.noStyle })

            const element = item.href ? (
              <a
                key={index}
                href={item.href}
                role="menuitem"
                className={className}
                onClick={(e) => {
                  item.onClick?.(e)
                  close()
                }}
              >
                {item.icon ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    width="full"
                    marginRight={2}
                  >
                    <Box
                      marginX={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        icon={item.icon}
                        type={item.iconType}
                        size="small"
                        color="blue400"
                      />
                    </Box>
                    {item.title}
                  </Box>
                ) : (
                  item.title
                )}
              </a>
            ) : (
              <button
                key={index}
                type="button"
                role="menuitem"
                className={className}
                onClick={(e) => {
                  item.onClick?.(e)
                  close()
                }}
              >
                {item.icon ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    width="full"
                    marginRight={2}
                  >
                    <Box
                      marginX={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        icon={item.icon}
                        type={item.iconType}
                        size="small"
                        color="blue400"
                      />
                    </Box>
                    {item.title}
                  </Box>
                ) : (
                  item.title
                )}
              </button>
            )

            return render(element, index, styles.menuItem)
          })}
        </div>
      )}
    </div>
  )
}

export default DropdownMenu
