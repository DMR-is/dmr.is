import {
  Box,
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  ResponsiveSpace,
  Stack,
  Text,
} from '@island.is/island-ui/core'
import { ImageProps } from '../Image/Image'

export type HeroProps = {
  title?: string
  description?: string
  breadcrumbs?: React.ComponentProps<typeof Breadcrumbs>
  image?: ImageProps
  children?: React.ReactNode
  variant?: 'default' | 'small'
}

export const BANNER_PORTAL_ID = 'banner-portal'

export const Hero = ({
  breadcrumbs,
  title,
  description,
  image,
  children,
  variant = 'default',
}: HeroProps) => {
  const hasTitleOrDescription = !!(title || description || breadcrumbs)
  const hasImage = !!(image && image.src)
  const hasChildren = !!children
  const isDefault = variant === 'default'

  const columnSpan: Record<
    string,
    React.ComponentProps<typeof GridColumn>['span']
  > = {
    content: ['12/12', '12/12', '12/12', '6/12'],
    image: ['12/12', '12/12', '12/12', isDefault ? '4/12' : '3/12'],
  }

  const bannerSpacing: ResponsiveSpace = [2, 3, 5, 6]
  const contentSpacing: ResponsiveSpace = isDefault
    ? [2, 3, 7, 8]
    : [2, 2, 3, 4]

  return (
    <Box paddingTop={bannerSpacing}>
      <GridContainer>
        <Stack space={4}>
          <GridRow>
            {hasTitleOrDescription && (
              <GridColumn
                offset={['0', '0', '0', '1/12']}
                span={columnSpan.content}
              >
                <Box paddingY={contentSpacing}>
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
                <Inline align="center">
                  <img src={image.src} alt={image.alt} />
                </Inline>
              </GridColumn>
            )}
          </GridRow>
          {isDefault && children && (
            <GridRow>
              <GridColumn span={['12/12']}>
                {hasChildren && children}
              </GridColumn>
            </GridRow>
          )}
        </Stack>
      </GridContainer>
    </Box>
  )
}
