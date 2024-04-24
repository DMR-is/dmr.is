import { Box, LinkV2, Text } from '@island.is/island-ui/core'

import * as styles from './BannerCard.css'

type Props = {
  title: string
  description: string
  image: string
  link: string
}

export const BannerCard = ({ title, description, image, link }: Props) => {
  return (
    <div className={styles.bannerCardWrapper}>
      <div className={styles.bannerCardTextWrapper}>
        <Text color="blue400" marginBottom={1} variant="h3" as="h2">
          <LinkV2 href={link}>{title}</LinkV2>
        </Text>
        <Text>{description}</Text>
      </div>
      <div className={styles.bannerCardImageWrapper}>
        <Box component="img" src={image} />
      </div>
    </div>
  )
}
