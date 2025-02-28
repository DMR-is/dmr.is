import {
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

type HeroImageProps = {
  src: string
  alt: string
}

export type HeroProps = {
  title?: string
  description?: string
  breadcrumbs?: React.ReactElement<typeof Breadcrumbs>
  image?: HeroImageProps
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
      <GridRow>
        {hasTitleOrDescription && (
          <GridColumn
            offset={['0', '0', '0', '1/12']}
            span={columnSpan.content}
          >
            <Stack space={2}>
              {breadcrumbs && breadcrumbs}
              <Stack space={1}>
                {title && <Text variant="h1">{title}</Text>}
                {description && <Text>{description}</Text>}
              </Stack>
            </Stack>
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
    </GridContainer>
  )
}
