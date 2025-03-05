import {
  Box,
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'
import { ImageProps } from '../Image/Image'

export type HeroProps = {
  title?: string
  description?: string
  breadcrumbs?: React.ReactElement<typeof Breadcrumbs>
  image?: ImageProps
  children?: React.ReactNode
}

export const BANNER_PORTAL_ID = 'banner-portal'

export const Hero = ({
  breadcrumbs,
  title,
  description,
  image,
  children,
}: HeroProps) => {
  const hasTitleOrDescription = !!(title || description || breadcrumbs)
  const hasImage = !!(image && image.src)
  const hasChildren = !!children

  const columnSpan: Record<
    string,
    React.ComponentProps<typeof GridColumn>['span']
  > = {
    content: hasImage ? ['12/12', '12/12', '12/12', '6/12'] : ['10/12'],
    image: hasImage ? ['12/12', '12/12', '12/12', '4/12'] : undefined,
  }

  return (
    <GridContainer>
      <Stack space={2}>
        <GridRow>
          {hasTitleOrDescription && (
            <GridColumn
              offset={['0', '0', '0', '1/12']}
              span={columnSpan.content}
            >
              <Box paddingY={[2, 3, 7, 8]}>
                <Stack space={2}>
                  {breadcrumbs && breadcrumbs}
                  <Stack space={1}>
                    {title && <Text variant="h1">{title}</Text>}
                    {description && <Text>{description}</Text>}
                  </Stack>
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
        <GridRow>
          <GridColumn span={['12/12']}>{hasChildren && children}</GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}
