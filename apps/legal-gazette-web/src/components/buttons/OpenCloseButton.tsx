import cn from 'classnames'

import {
  Icon,
  Inline,
  Text,
  useBoxStyles,
} from '@dmr.is/ui/components/island-is'

import * as styles from './OpenCloseButton.css'

type OpenCloseButtonProps = {
  label?: string
  onClick?: () => void
  isOpen?: boolean
}

export const OpenCloseButton = ({
  label,
  onClick,
  isOpen,
}: OpenCloseButtonProps) => {
  const buttonClass = useBoxStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'full',
    background: 'blue100',
    component: 'button',
    padding: 'smallGutter',
  })

  return (
    <button type="button" onClick={onClick}>
      <Inline alignY="center" space={1}>
        {label && (
          <Text variant="small" fontWeight="medium">
            {label}
          </Text>
        )}
        <div className={buttonClass}>
          <span className={styles.iconContainer}>
            <span
              className={cn(styles.removeIcon, {
                [styles.showRemoveIcon]: isOpen,
              })}
            >
              <Icon icon="remove" size="small" color="blue400" />
            </span>
            <span
              className={cn(styles.addIcon, {
                [styles.hideAddIcon]: isOpen,
              })}
            >
              <Icon icon="add" size="small" color="blue400" />
            </span>
          </span>
        </div>
      </Inline>
    </button>
  )
}
