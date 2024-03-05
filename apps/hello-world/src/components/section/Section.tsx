import * as styles from './Section.css'
import cn from 'classnames'

type Props = {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'blue'
}
export const Section = ({
  children,
  className = '',
  variant = 'default',
}: Props) => {
  return (
    <section className={cn(styles.section({ variant }), className)}>
      {children}
    </section>
  )
}
