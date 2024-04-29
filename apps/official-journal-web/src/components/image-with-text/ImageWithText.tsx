import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Icon,
  LinkV2,
  Text,
} from '@island.is/island-ui/core'

import * as styles from './ImageWithText.css'

type Props = {
  image?: string
  align?: 'ltr' | 'rtl'
  kicker?: string
  title?: string
  intro?: string
  text?: string
  link?: string
  linkText?: string
  linkIcon?: React.ComponentProps<typeof Icon>['icon']
  linkIconType?: React.ComponentProps<typeof Icon>['type']
}

export const ImageWithText = ({
  image,
  align = 'ltr',
  text,
  kicker,
  title,
  intro,
  link,
  linkText,
  linkIcon,
  linkIconType,
}: Props) => {
  return (
    <GridContainer>
      <GridRow direction={align === 'ltr' ? 'row' : 'rowReverse'}>
        <GridColumn offset={['0', '1/12']} span={['12/12', '5/12']}>
          {image && <Box component="img" src={image} />}
        </GridColumn>
        <GridColumn className={styles.contentColumn} span={['12/12', '5/12']}>
          {kicker && (
            <Text variant="eyebrow" marginBottom={2} color="purple400">
              {kicker}
            </Text>
          )}
          {title && (
            <Text variant="h2" as="h2">
              {title}
            </Text>
          )}
          {intro && (
            <Text variant="intro" marginTop={title ? 2 : undefined}>
              {intro}
            </Text>
          )}
          {text && (
            <Text marginTop={title || intro ? 2 : undefined}>{text}</Text>
          )}
          {link && linkText && (
            <Box className={styles.linkWrapper}>
              <LinkV2 href={link}>
                <Text variant="eyebrow" color="blue400">
                  {linkText}
                  {linkIcon && (
                    <Icon
                      className={styles.linkIcon}
                      icon={linkIcon}
                      type={linkIconType}
                      color="currentColor"
                    />
                  )}
                </Text>
              </LinkV2>
            </Box>
          )}
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
