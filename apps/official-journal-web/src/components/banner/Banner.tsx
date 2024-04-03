import React from 'react'

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

import { useFilterContext } from '../../hooks/useFilterContext'
import { useNotificationContext } from '../../hooks/useNotificationContext'
import { BannerCard, BannerCardList } from '../banner-card/BannerCardList'
import { CaseFilters } from '../case-filters/CaseFilters'
import { Section } from '../section/Section'
import * as styles from './Banner.css'

type Props = {
  title?: string
  description?: string
  cards?: BannerCard[]
  imgSrc?: string
  variant?: 'small' | 'large'
  showFilters?: boolean
  breadcrumbs?: React.ComponentProps<typeof Breadcrumbs>['items']
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
  const { renderFilters } = useFilterContext()

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
                <Breadcrumbs items={breadcrumbs} />
                <Text
                  marginTop={breadcrumbs.length ? 1 : 0}
                  marginBottom={1}
                  variant={variant === 'large' ? 'h1' : 'h2'}
                >
                  {title}
                </Text>
                <Text marginBottom={showFilters ? 4 : 0}>{description}</Text>
                {notifications.length > 0 && (
                  <Box marginBottom={renderFilters ? 3 : 1}>
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
