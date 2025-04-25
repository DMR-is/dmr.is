import { ComponentProps } from 'react'

import {
  BoxProps,
  Icon,
  Inline,
  Text,
  useBoxStyles,
} from '@island.is/island-ui/core'

type IconProps = ComponentProps<typeof Icon>

type Props = Pick<IconProps, 'icon' | 'size' | 'color' | 'type'> & {
  label?: string
  background?: BoxProps['background']
  onClick?: () => void
}

export const IconButton = (props: Props) => {
  const paddingModifier =
    props.size === 'small' ? 1 : props.size === 'medium' ? 2 : 3

  const buttonClass = useBoxStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'full',
    background: props?.background || 'blue100',
    component: 'button',
    padding: 'smallGutter',
  })

  const withDefault = {
    ...props,
    size: props.size || 'medium',
    color: props.color || 'blue400',
  }

  return (
    <button type="button" onClick={props.onClick}>
      <Inline alignY="center" space={1}>
        {props.label && (
          <Text variant="small" fontWeight="medium">
            {props.label}
          </Text>
        )}
        <div className={buttonClass}>
          <Icon {...withDefault} />
        </div>
      </Inline>
    </button>
  )
}
