import { useState } from 'react'

export const useToggle = (defaultToggle = false) => {
  const [internalToggle, setInternalTogle] = useState(defaultToggle)

  const onToggle = () => {
    setInternalTogle((prev) => !prev)
  }

  const setToggle = (value: boolean) => {
    setInternalTogle(value)
  }

  return {
    toggle: internalToggle,
    onToggle,
    setToggle,
  }
}
