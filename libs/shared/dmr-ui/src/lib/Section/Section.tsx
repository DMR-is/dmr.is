import cn from 'classnames'

import * as styles from './Section.css'

export type SectionProps = {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'blue'
  bleed?: boolean
  paddingTop?: 'default' | 'off' | 'content'
}
export const Section = ({
  children,
  className = '',
  variant = 'default',
  bleed = false,
  paddingTop = 'default',
}: SectionProps) => {
  return (
    <section
      className={cn(styles.section({ variant, bleed, paddingTop }), className)}
    >
      {children}
    </section>
  )
}
