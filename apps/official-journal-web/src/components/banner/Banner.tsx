import {
  Box,
  Breadcrumbs,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import * as styles from './Banner.css'
import { Section } from '../section/Section'
import { BannerCard, BannerCardList } from '../banner-card/BannerCardList'
import { CaseFilters } from '../case-filters/CaseFilters'

type Props = {
  title?: string
  description?: string
  cards?: BannerCard[]
  imgSrc?: string
  variant?: 'small' | 'large'
  showFilters?: boolean
  breadcrumbs?: React.ComponentProps<typeof Breadcrumbs>['items']
}

export const Banner = ({
  title,
  description,
  cards,
  imgSrc,
  variant,
  showFilters = false,
  breadcrumbs = [],
}: Props) => {
  return (
    <Section className={styles.bannerSection}>
      <GridContainer>
        <GridRow>
          {(title || description) && (
            <>
              <GridColumn span={['12/12', '12/12', '1/12']}></GridColumn>
              <GridColumn
                span={['12/12', '12/12', '5/12']}
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
                {showFilters && <CaseFilters />}
              </GridColumn>
            </>
          )}
          {imgSrc && (
            <GridColumn
              className={styles.bannerImageColumn}
              span={['12/12', '12/12', '5/12']}
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
