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

const mockBannerCards = [
  {
    title: messages.components.banner.cards.editorial.title,
    text: messages.components.banner.cards.editorial.description,
    link: '/ritstjorn',
    image: '/assets/ritstjorn-image.svg',
  },
  {
    title: messages.components.banner.cards.publishing.title,
    text: messages.components.banner.cards.publishing.description,
    link: '/ritstjorn',
    image: '/assets/utgafa-image.svg',
  },
  {
    title: messages.components.banner.cards.all.title,
    text: messages.components.banner.cards.all.description,
    link: '/ritstjorn',
    image: '/assets/heildar-image.svg',
  },
]

export const Banner = () => {
  return (
    <Section className={styles.bannerSection}>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '1/12']}></GridColumn>
          <GridColumn
            span={['12/12', '12/12', '5/12']}
            className={styles.bannerContentColumn}
          >
            <Text variant="h1">{messages.components.banner.title}</Text>
            <Text>{messages.components.banner.description}</Text>
          </GridColumn>
          <GridColumn
            className={styles.bannerImageColumn}
            span={['12/12', '12/12', '5/12']}
          >
            <Box justifyContent="center" display="flex">
              <Box component="img" src="/assets/banner-image.svg" />
            </Box>
          </GridColumn>
        </GridRow>
        <GridRow className={styles.footerWrapper}>
          {mockBannerCards.map((item, index) => (
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
      </GridContainer>
    </Section>
  )
}
