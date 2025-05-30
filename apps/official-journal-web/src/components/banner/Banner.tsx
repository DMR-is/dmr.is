import dynamic from 'next/dynamic'

import { MessageDescriptor } from 'react-intl'

import {
  Box,
  Breadcrumbs,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Text,
} from '@island.is/island-ui/core'

import { CaseStatusEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { NOTIFICATION_PORTAL_ID } from '../../lib/constants'
import { BannerCard, BannerCardList } from '../banner-card/BannerCardList'
import { Section } from '../section/Section'
import * as styles from './Banner.css'

type BreadcrumbsProps = Array<
  Omit<React.ComponentProps<typeof Breadcrumbs>['items'][number], 'title'> & {
    title: string | MessageDescriptor
  }
>

type Props = {
  title?: string | MessageDescriptor
  description?: string | MessageDescriptor
  cards?: BannerCard[]
  imgSrc?: string
  variant?: 'small' | 'large'
  breadcrumbs?: BreadcrumbsProps
  imageColumnSpan?: React.ComponentProps<typeof GridColumn>['span']
  contentColumnSpan?: React.ComponentProps<typeof GridColumn>['span']
  enableCategories?: boolean
  enableDepartments?: boolean
  enableTypes?: boolean
  enableSearch?: boolean
  statuses?: CaseStatusEnum[]
}

const CaseFilters = dynamic(() => import('../case-filters/CaseFilters'), {
  ssr: false,
  loading: () => (
    <Inline space={2}>
      <Input
        placeholder="Leita eftir málsnafni"
        disabled
        loading
        size="sm"
        icon={{ name: 'search', type: 'outline' }}
        backgroundColor="blue"
        name="filter-loader"
      />
      <Button variant="utility" icon="filter" disabled loading>
        Opna síu
      </Button>
    </Inline>
  ),
})

export const Banner = ({
  title,
  description,
  cards,
  imgSrc,
  variant,
  breadcrumbs = [],
  imageColumnSpan = ['12/12', '12/12', '5/12'],
  contentColumnSpan = ['12/12', '12/12', '5/12'],
  enableCategories = false,
  enableDepartments = false,
  enableTypes = false,
  enableSearch = false,
  statuses = [],
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const showFilters =
    enableCategories || enableDepartments || enableTypes || enableSearch

  return (
    <Section className={styles.bannerSection}>
      <GridContainer>
        <GridRow>
          {(title || description) && (
            <>
              <GridColumn span={['12/12', '12/12', '1/12']}></GridColumn>
              <GridColumn
                span={contentColumnSpan}
                className={styles.bannerContentColumn}
              >
                <Breadcrumbs
                  items={breadcrumbs.map((b) => ({
                    title:
                      typeof b.title === 'object'
                        ? formatMessage(b.title)
                        : b.title,
                    href: b.href,
                  }))}
                />
                <Text
                  marginTop={breadcrumbs.length ? 1 : 0}
                  marginBottom={1}
                  variant={variant === 'large' ? 'h1' : 'h2'}
                  as="h1"
                >
                  {typeof title === 'object' ? formatMessage(title) : title}
                </Text>
                <Text marginBottom={showFilters ? 4 : 0}>
                  {typeof description === 'object'
                    ? formatMessage(description)
                    : description}
                </Text>
                <div id={NOTIFICATION_PORTAL_ID} />
                {showFilters && (
                  <CaseFilters
                    statuses={statuses}
                    enableCategories={enableCategories}
                    enableDepartments={enableDepartments}
                    enableTypes={enableTypes}
                    enableSearch={enableSearch}
                  />
                )}
              </GridColumn>
            </>
          )}
          {imgSrc && (
            <GridColumn
              className={styles.bannerImageColumn}
              span={imageColumnSpan}
            >
              <Box justifyContent="center" display="flex">
                <Box component="img" src={imgSrc} />
              </Box>
            </GridColumn>
          )}
        </GridRow>
        {cards && <BannerCardList cards={cards} />}
      </GridContainer>
    </Section>
  )
}

export default Banner
