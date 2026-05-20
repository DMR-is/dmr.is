'use client'

import { useLogOut } from '@dmr.is/auth/useLogOut'
import { Button } from '@dmr.is/ui/components/island-is/Button'

import { headerText } from '../lib/text'

export const LogoutButton = () => {
  const logOut = useLogOut()
  return (
    <Button
      variant="ghost"
      icon="logOut"
      iconType="outline"
      onClick={() => logOut()}
    >
      {headerText.logoutButton}
    </Button>
  )
}
