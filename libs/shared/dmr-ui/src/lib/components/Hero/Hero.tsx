'use client'
import { justifyContent } from 'submodules/island.is/libs/island-ui/core/src/lib/Box/useBoxStyles.css'

import {
  Box,
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  ResponsiveProp,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { ImageProps } from '../Image/Image'
type SpanType = React.ComponentProps<typeof GridColumn>['span']

export type HeroProps = {
  title?: string
  description?: string
  breadcrumbs?: React.ComponentProps<typeof Breadcrumbs>
  image?: ImageProps
  children?: React.ReactNode
  variant?: 'default' | 'small'
  noImageFullWidth?: boolean
  withOffset?: boolean
  contentSpan?: SpanType
  imageSpan?: SpanType
  button?: React.ReactNode
  alignHeader?: ResponsiveProp<keyof typeof justifyContent>
}

export const BANNER_PORTAL_ID = 'banner-portal'

export const Hero = ({
  breadcrumbs,
  title,
  description,
  image,
  children,
  variant = 'default',
  noImageFullWidth = false,
  withOffset = true,
  contentSpan = [
    '12/12',
    '12/12',
    '12/12',
    noImageFullWidth ? '12/12' : '6/12',
  ],
  imageSpan = ['12/12', '12/12', '12/12', '4/12'],
  button,
  alignHeader = 'flexStart',
}: HeroProps) => {
  const hasTitleOrDescription = !!(title || description || breadcrumbs)
  const hasImage = !!(image && image.src)
  const hasChildren = !!children
  const isDefault = variant === 'default'

  const offset: SpanType = ['0', '0', '0', withOffset ? '1/12' : '0']

  return (
    <GridContainer>
      <Stack space={4}>
        <GridRow align={alignHeader}>
          {hasTitleOrDescription && (
            <GridColumn offset={offset} span={contentSpan}>
              <Box height="full" display="flex" alignItems="center">
                <Stack space={2}>
                  {breadcrumbs && <Breadcrumbs {...breadcrumbs} />}

                  <Stack space={4}>
                    {title && (
                      <Text variant={isDefault ? 'h1' : 'h2'}>{title}</Text>
                    )}

                    {description && <Text variant="intro">{description}</Text>}
                    {button && <Inline space={2}>{button}</Inline>}
                  </Stack>

                  {!isDefault && children && children}
                </Stack>
              </Box>
            </GridColumn>
          )}
          {hasImage && (
            <GridColumn hiddenBelow="lg" span={imageSpan}>
              <img src={image.src} alt={image.alt} />
            </GridColumn>
          )}
        </GridRow>
        {isDefault && children && (
          <GridRow>
            <GridColumn span={['12/12']}>{hasChildren && children}</GridColumn>
          </GridRow>
        )}
      </Stack>
    </GridContainer>
  )
}

export default Hero
