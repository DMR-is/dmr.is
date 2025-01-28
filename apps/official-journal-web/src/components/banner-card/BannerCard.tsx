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
      <Box className={styles.bannerCard}>
        <div className={styles.bannerCardTextWrapper}>
          <Text color="blue400" marginBottom={1} variant="h3" as="h2">
            {/* <Text> breaks direct Link child component so we wrap it with span -.- */}
            <span>
              <LinkV2 href={link} underline="normal">
                {title}
              </LinkV2>
            </span>
          </Text>
          <Text>{description}</Text>
        </div>
        <div className={styles.bannerCardImageWrapper}>
          <Box component="img" src={image} />
        </div>
      </Box>
    </div>
  )
}
