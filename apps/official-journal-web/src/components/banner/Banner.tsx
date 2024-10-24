import { MessageDescriptor } from 'react-intl'

import {
  AlertMessage,
  Box,
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useNotificationContext } from '../../hooks/useNotificationContext'
import { BannerCard, BannerCardList } from '../banner-card/BannerCardList'
import { CaseFilters } from '../case-filters/CaseFilters'
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
  showFilters?: boolean
  breadcrumbs?: BreadcrumbsProps
  imageColumnSpan?: React.ComponentProps<typeof GridColumn>['span']
  contentColumnSpan?: React.ComponentProps<typeof GridColumn>['span']
}

export const Banner = ({
  title,
  description,
  cards,
  imgSrc,
  variant,
  showFilters = false,
  breadcrumbs = [],
  imageColumnSpan = ['12/12', '12/12', '5/12'],
  contentColumnSpan = ['12/12', '12/12', '5/12'],
}: Props) => {
  const { notifications } = useNotificationContext()
  const { formatMessage } = useFormatMessage()

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
                {notifications.length > 0 && (
                  <Box marginBottom={3}>
                    <Stack space={3}>
                      {notifications.map((notification, index) => (
                        <AlertMessage
                          key={index}
                          type={notification.type ?? 'info'}
                          title={notification.title}
                          message={notification.message}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                {showFilters && <CaseFilters />}
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
