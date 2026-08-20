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
import { createPortal } from 'react-dom'

import * as styles from './ModalBase.css'

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

  // The portal below cannot render during SSR or on the first client render,
  // so nothing may touch `document` or `dialogRef` until after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // These only move state. Calling dialog.showModal() here would silently do
  // nothing whenever the ref is not attached yet, which is every call that
  // happens on mount.
  const showModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])

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

  // Drive the native <dialog> from `open`, keyed on `mounted` so it also runs
  // for the initial render once the portal exists. This covers initialVisibility
  // and an isVisible that is already true at mount.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, mounted])

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
  }, [hideOnEsc, mounted])

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
  }, [hideOnClickOutside, closeModal, mounted])

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

      {mounted &&
        renderModal &&
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
