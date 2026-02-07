'use client'

import { ImageProps } from '@dmr.is/ui/components/Image/Image'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export type HeroProps = {
  title?: string
  description?: string
  breadcrumbs?: React.ComponentProps<typeof Breadcrumbs>
  image?: ImageProps
  children?: React.ReactNode
  variant?: 'default' | 'small'
  noImageFullWidth?: boolean
  withOffset?: boolean
}

export const BANNER_PORTAL_ID = 'banner-portal'

type SpanType = React.ComponentProps<typeof GridColumn>['span']

export const Hero = ({
  breadcrumbs,
  title,
  description,
  image,
  children,
  variant = 'default',
  noImageFullWidth = false,
  withOffset = true,
}: HeroProps) => {
  const hasTitleOrDescription = !!(title || description || breadcrumbs)
  const hasImage = !!(image && image.src)
  const hasChildren = !!children
  const isDefault = variant === 'default'

  const columnSpan: Record<string, SpanType> = {
    content: [
      '12/12',
      '12/12',
      '12/12',
      !hasImage && noImageFullWidth ? '12/12' : '6/12',
    ],
    image: ['12/12', '12/12', '12/12', '4/12'],
  }

  const offset: SpanType = ['0', '0', '0', withOffset ? '1/12' : '0']

  return (
    <GridContainer>
      <Stack space={4}>
        <GridRow>
          {hasTitleOrDescription && (
            <GridColumn offset={offset} span={columnSpan.content}>
              <Box
                dataTestId="hello-world"
                height="full"
                display="flex"
                alignItems="center"
              >
                <Stack space={4}>
                  <Stack space={2}>
                    {breadcrumbs && <Breadcrumbs {...breadcrumbs} />}
                    <Stack space={1}>
                      {title && (
                        <Text variant={isDefault ? 'h1' : 'h2'}>{title}</Text>
                      )}
                      {description && <Text>{description}</Text>}
                    </Stack>
                  </Stack>
                  {!isDefault && children && children}
                </Stack>
              </Box>
            </GridColumn>
          )}
          {hasImage && (
            <GridColumn hiddenBelow="lg" span={columnSpan.image}>
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
