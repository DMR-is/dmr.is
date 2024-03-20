import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import * as styles from './Banner.css'
import { Section } from '../section/Section'
import { BannerCard, BannerCardList } from '../banner-card/BannerCardList'

type Props = {
  title?: string
  description?: string
  cards?: BannerCard[]
  imgSrc?: string
  variant?: 'small' | 'large'
}

export const Banner = ({
  title,
  description,
  cards,
  imgSrc,
  variant = 'large',
}: Props) => {
  return (
    <Section className={styles.bannerSection({ variant: variant })}>
      <GridContainer>
        <GridRow>
          {(title || description) && (
            <>
              <GridColumn span={['12/12', '12/12', '1/12']}></GridColumn>
              <GridColumn
                span={['12/12', '12/12', '5/12']}
                className={styles.bannerContentColumn}
              >
                <Text
                  marginBottom={1}
                  variant={variant === 'large' ? 'h1' : 'h2'}
                >
                  {title}
                </Text>
                <Text>{description}</Text>
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
