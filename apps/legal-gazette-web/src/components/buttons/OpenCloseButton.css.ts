import { style } from '@vanilla-extract/css'

export const iconContainer = style({
  position: 'relative',
  width: 16,
  height: 16,
})

export const addIcon = style({
  position: 'absolute',
  inset: 0,
  opacity: 1,
  transform: 'rotate(0deg)',
  transition: 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out',
})

export const removeIcon = style({
  position: 'absolute',
  inset: 0,
  opacity: 0,
  transform: 'rotate(-90deg)',
  transition: 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out',
})

export const showRemoveIcon = style({
  opacity: 1,
  transform: 'rotate(0deg)',
})

export const hideAddIcon = style({
  opacity: 0,
  transform: 'rotate(90deg)',
})
