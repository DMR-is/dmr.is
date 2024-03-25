import { GridColumn, GridRow } from '@island.is/island-ui/core'
import { BannerCard } from './BannerCard'
import * as styles from './BannerCardList.css'
export type BannerCard = {
  title: string
  text: string
  link: string
  image: string
}

type Props = {
  cards: BannerCard[]
}

export const BannerCardList = ({ cards }: Props) => {
  return (
    <GridRow className={styles.bannerCardList}>
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
  )
}
