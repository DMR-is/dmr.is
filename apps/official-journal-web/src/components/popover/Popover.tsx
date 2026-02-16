import { cloneElement, ReactElement, useEffect, useRef, useState } from 'react'

import * as styles from './Popover.css'

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disclosure: ReactElement<any>
  children: React.ReactNode
  placement?: string
  label: string
}

export const Popover = ({ disclosure, children, label }: Props) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {cloneElement(disclosure, {
        onClick: (e: React.MouseEvent) => {
          disclosure.props.onClick?.(e)
          setOpen((prev) => !prev)
        },
        'aria-expanded': open,
        'aria-haspopup': true,
      })}
      {open && (
        <div className={styles.popover} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  )
}
