import { MessageDescriptor } from 'react-intl'

import { GridColumn, GridRow } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { BannerCard } from './BannerCard'
import * as styles from './BannerCardList.css'
export type BannerCard = {
  title: string | MessageDescriptor
  text: string | MessageDescriptor
  link: string
  image: string
}

type Props = {
  cards: BannerCard[]
}

export const BannerCardList = ({ cards }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <GridRow className={styles.bannerCardList}>
      {cards.map((item, index) => (
        <GridColumn span={['1/1', '1/3', '1/3', '1/3']} key={index}>
          <BannerCard
            title={
              typeof item.title === 'object'
                ? formatMessage(item.title)
                : item.title
            }
            description={
              typeof item.text === 'object'
                ? formatMessage(item.text)
                : item.text
            }
            link={item.link}
            image={item.image}
          />
        </GridColumn>
      ))}
    </GridRow>
  )
}
