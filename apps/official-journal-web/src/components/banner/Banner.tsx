import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@island.is/island-ui/core'

import * as styles from './Banner.css'
import { BannerCard } from '../banner-card/BannerCard'
import { Section } from '../section/Section'
import { messages } from '../../lib/messages'

type BannerCard = {
  title: string
  text: string
  link: string
  image: string
}

type Props = {
  title?: string
  description?: string
  cards?: BannerCard[]
  imgSrc?: string
}

export const Banner = ({ title, description, cards, imgSrc }: Props) => {
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
                <Text variant="h1">{title}</Text>
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
        {cards && (
          <GridRow className={styles.footerWrapper}>
            {cards.map((item, index) => (
              <GridColumn span={['1/1', '1/2', '1/2', '1/3']} key={index}>
                <BannerCard
                  title={item.title}
                  description={item.text}
                  link={item.link}
                  image={item.image}
                />
              </GridColumn>
            ))}
          </GridRow>
        )}
      </GridContainer>
    </Section>
  )
}
