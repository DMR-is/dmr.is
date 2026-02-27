'use client'

import cn from 'classnames'
import React, {
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import * as styles from './ModalBase.css'
import { createPortal } from 'react-dom'

export type ModalBaseProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disclosure?: ReactElement<any>
  baseId: string
  className?: string
  initialVisibility?: boolean
  toggleClose?: boolean
  onVisibilityChange?: (isVisible: boolean) => void
  backdropWhite?: boolean
  modalLabel?: string
  removeOnClose?: boolean
  isVisible?: boolean
  hideOnClickOutside?: boolean
  tabIndex?: number
  hideOnEsc?: boolean
  preventBodyScroll?: boolean
  children?:
    | React.ReactNode
    | ((props: { closeModal: () => void }) => React.ReactNode)
}

export const ModalBase: FC<ModalBaseProps> = ({
  disclosure,
  baseId,
  className,
  initialVisibility = false,
  toggleClose,
  onVisibilityChange,
  backdropWhite,
  modalLabel,
  removeOnClose,
  isVisible,
  hideOnClickOutside = true,
  tabIndex,
  hideOnEsc = true,
  preventBodyScroll = true,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(initialVisibility)
  const isFirstRender = useRef(true)

  const showModal = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog?.open) {
      dialog.close()
    }
    setOpen(false)
  }, [])

  // Fire onVisibilityChange after state changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onVisibilityChange?.(open)
  }, [open])

  // Controlled visibility via isVisible prop
  useEffect(() => {
    if (isVisible === true && !open) {
      showModal()
    } else if (isVisible === false && open) {
      closeModal()
    }
  }, [isVisible])

  // toggleClose
  useEffect(() => {
    if (toggleClose) {
      closeModal()
    }
  }, [toggleClose])

  // Initial visibility
  useEffect(() => {
    if (initialVisibility) {
      showModal()
    }
  }, [])

  // Handle native dialog cancel event (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      if (!hideOnEsc) {
        e.preventDefault()
      } else {
        setOpen(false)
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [hideOnEsc])

  // Handle click outside (click on backdrop)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClick = (e: MouseEvent) => {
      if (hideOnClickOutside && e.target === dialog) {
        closeModal()
      }
    }

    dialog.addEventListener('click', handleClick)
    return () => dialog.removeEventListener('click', handleClick)
  }, [hideOnClickOutside, closeModal])

  // Body scroll lock
  useEffect(() => {
    if (!preventBodyScroll) return
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open, preventBodyScroll])

  const renderModal = !removeOnClose || open

  return (
    <>
      {disclosure &&
        React.cloneElement(disclosure, {
          onClick: (e: React.MouseEvent) => {
            disclosure.props.onClick?.(e)
            showModal()
          },
          'aria-haspopup': 'dialog',
          'aria-controls': baseId,
        })}

      {renderModal &&
        createPortal(
          <dialog
            ref={dialogRef}
            id={baseId}
            className={cn(
              styles.dialog,
              backdropWhite
                ? styles.backdropColor.white
                : styles.backdropColor.default,
              className,
            )}
            aria-label={modalLabel}
            tabIndex={tabIndex}
          >
            {typeof children === 'function'
              ? children({ closeModal })
              : children}
          </dialog>,
          document.body,
        )}
    </>
  )
}
