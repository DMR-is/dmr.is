import * as styles from './Spinner.css'

type Props = {
  size?: 'small' | 'medium' | 'large'
}

export const Spinner = ({ size = 'medium' }: Props) => (
  <div className={styles.spinner({ size: size })} />
)
