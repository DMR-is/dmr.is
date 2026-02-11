import { useEffect, useRef, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'

type Props = {
  onDelete: () => void
  confirmButton: string
  confirmText: string
  icon: React.ComponentProps<typeof Icon>['icon']
}

export const DeleteCorrections = ({
  onDelete,
  confirmButton,
  confirmText,
  icon,
}: Props) => {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setConfirmDelete(false)
      }
    }

    if (confirmDelete) {
      document.addEventListener('mousedown', handleOutsideClick)
    } else {
      document.removeEventListener('mousedown', handleOutsideClick)
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [confirmDelete])

  return (
    <Box>
      <Button
        ref={buttonRef}
        variant="text"
        colorScheme={confirmDelete ? 'destructive' : 'default'}
        as="button"
        size="small"
        onClick={
          confirmDelete
            ? () => {
                onDelete()
                setConfirmDelete(false)
              }
            : () => setConfirmDelete(true)
        }
      >
        <Box display="flex" alignItems="center" columnGap="smallGutter">
          {confirmDelete ? confirmText : confirmButton}
          <Icon icon={icon} type="outline" size="small" />
        </Box>
      </Button>
    </Box>
  )
}
