import { useState } from 'react'

export const useToggle = (defaultToggle = false) => {
  const [expanded, setExpanded] = useState(defaultToggle)

  return {
    expanded,
    setExpanded,
  }
}
