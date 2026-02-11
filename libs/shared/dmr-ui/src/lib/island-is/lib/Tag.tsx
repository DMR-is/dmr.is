'use client'
import cn from 'classnames'
import { FC, forwardRef, ReactNode } from 'react'

import { shouldLinkOpenInNewWindow } from '@island.is/shared/utils'

import * as styles from './Tag.css'
import { Text } from './Text'

export type TagVariant =
  | 'blue'
  | 'darkerBlue'
  | 'purple'
  | 'white'
  | 'red'
  | 'rose'
  | 'blueberry'
  | 'dark'
  | 'mint'
  | 'yellow'
  | 'disabled'
  | 'warn'

export interface TagProps {
  onClick?: () => void
  variant?: TagVariant
  href?: string
  id?: string
  active?: boolean
  disabled?: boolean
  outlined?: boolean
  /** Renders a red dot driving attention to the tag. */
  attention?: boolean
  children: string | ReactNode
  truncate?: boolean
  hyphenate?: boolean
  textLeft?: boolean
  CustomLink?: FC<React.PropsWithChildren<unknown>>
  whiteBackground?: boolean
}

export const Tag = forwardRef<HTMLButtonElement & HTMLAnchorElement, TagProps>(
  (
    {
      children,
      href,
      onClick,
      variant = 'blue',
      active,
      disabled,
      outlined,
      attention,
      truncate,
      hyphenate,
      textLeft,
      CustomLink,
      whiteBackground,
      ...props
    }: TagProps,
    ref,
  ) => {
    const className = cn(styles.container, styles.variants[variant], {
      [styles.active]: active,
      [styles.outlined]: outlined,
      [styles.attention]: attention,
      [styles.focusable]: !disabled,
      [styles.hyphenate]: hyphenate,
      [styles.textLeft]: textLeft,
      [styles.disabled]: disabled,
      [styles.whiteBackground]: whiteBackground,
    })

    const isExternal = href && shouldLinkOpenInNewWindow(href)

    const anchorProps = {
      ...(isExternal && { rel: 'noreferrer noopener' }),
    }

    const sharedProps = {
      className,
      ref,
    }


    const content = (
      <Text variant="eyebrow" as="span" truncate={truncate}>
        {children}
      </Text>
    )

    if (CustomLink) {
      return <CustomLink {...sharedProps}>{content}</CustomLink>
    }

    return href ? (
      <a href={href} {...anchorProps} {...sharedProps} {...props}>
        {content}
      </a>
    ) : onClick ? (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        {...sharedProps}
        {...props}
      >
        {content}
      </button>
    ) : (
      <span {...sharedProps} {...props}>
        {content}
      </span>
    )
  },
)

