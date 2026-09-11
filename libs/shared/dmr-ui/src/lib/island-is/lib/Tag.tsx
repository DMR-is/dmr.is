'use client'
import cn from 'classnames'
import { FC, forwardRef, ReactNode } from 'react'

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
  /**
   * Renders the label at regular weight instead of semi-bold.
   *
   * The default is island-ui's `eyebrow` (600), which is built for a tag that
   * appears once or twice on a page and has to be noticed. In a dense table it
   * works against itself: every row shouts, so nothing stands out, and a column
   * of bold pills reads heavier than the company names beside it. `light` keeps
   * the same size and colour and drops only the weight.
   *
   * Colour still carries the meaning, so this does not weaken the signal — it
   * stops the signal competing with the data it annotates.
   */
  light?: boolean
}

// Inlined from @island.is/shared/utils
const hosts = '(island\\.is|devland\\.is|localhost:\\d{4,5})'
const template = `^https{0,1}:\\/\\/([^\\/]{1,2048}\\.){0,1}${hosts}(\\/|$)`
const islandisRe = new RegExp(template)

const shouldLinkOpenInNewWindow = (href: string): boolean => {
  const externalCandidate =
    typeof href === 'string' && href.indexOf('://') !== -1

  return externalCandidate && !href.match(islandisRe)
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
      light,
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


    // `small` and `eyebrow` share a font size (xxs); they differ only in weight
    // — regular vs semiBold. So this swaps the weight and nothing else.
    const content = (
      <Text variant={light ? 'small' : 'eyebrow'} as="span" truncate={truncate}>
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

