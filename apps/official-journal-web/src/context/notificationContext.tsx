import { useState } from 'react'
import { createContext } from 'react'

type Notification = {
  title?: string
  message?: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

type NotificationContextProps = {
  notifications: Notification[]
  setNotifications: (notification: Notification) => void
  clearNotifications: () => void
}

export const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  setNotifications: () => {},
  clearNotifications: () => {},
})

export const NotificationContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const setNotifications = (notification: Notification) => {
    setState((prev) => ({
      ...prev,
      notifications: [...prev.notifications, notification],
    }))
  }

  const clearNotifications = () => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }))
  }

  const initalState: NotificationContextProps = {
    notifications: [],
    setNotifications,
    clearNotifications,
  }

  const [state, setState] = useState(initalState)

  return (
    <NotificationContext.Provider value={state}>
      {children}
    </NotificationContext.Provider>
  )
}
