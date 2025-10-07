import { useState } from 'react'

export const useToggle = (defaultToggle = false) => {
  const [expanded, setExpanded] = useState(defaultToggle)

  const onToggle = () => {
    setExpanded((prev) => !prev)
  }

  const setToggle = (value: boolean) => {
    setExpanded(value)
  }

  return {
    expanded,
    onToggle,
    setToggle,
  }
}
