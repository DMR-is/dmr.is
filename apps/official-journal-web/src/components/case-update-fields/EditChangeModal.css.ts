import {
  diffStyling,
  regulationContentStyling,
} from '@dmr.is/island-regulations/styling'
import { spacing, theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

// Full-screen layover modal
export const layoverModal = style({
  overflow: 'hidden',
  backgroundColor: 'white',
  width: 'calc(100% - 40px)',
  height: 'calc(100% - 40px)',
  overflowY: 'auto',
  margin: 20,
  borderRadius: theme.border.radius.large,
})

// Modal content area
export const modalContent = style({
  maxWidth: '860px',
  margin: '0 auto',
  padding: `${spacing[3]}px ${spacing[4]}px`,
})

// Slide-in reference text panel (right side)
export const referenceTextContainer = style({
  position: 'fixed',
  top: '2vh',
  zIndex: 10010,
  height: 0,
  transition: 'all 300ms 200ms ease-in-out',
  transitionProperty: 'transform',
  width: '45rem',
  maxWidth: '90vw',
  left: '50%',
  transform: 'translateX(calc(50vw - 5%))',

  selectors: {
    '&:hover': {
      transform: 'translateX(calc(50vw - 101%))',
    },
  },
})

export const referenceText = style({
  height: '96vh',
  overflow: 'hidden',
  borderRadius: theme.border.radius.standard,
  border: `1px solid ${theme.color.dark200}`,
  backgroundColor: '#ffffff',
  boxShadow: '-1rem 1rem 2rem rgba(0, 0, 0, 0.15)',
})

export const referenceTextLegend = style({
  padding: spacing[3],
  width: '45rem',
  maxWidth: '90vw',
  fontSize: '1.6rem',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  backgroundColor: theme.color.dark100,
})

export const referenceTextTitle = style({
  marginBottom: '1rem',
  fontSize: '1.4rem',
  fontWeight: 600,
})

export const referenceTextInner = style({
  padding: spacing[2],
  width: '45rem',
  maxWidth: '90vw',
  height: '80vh',
  overflowY: 'auto',
  borderBottom: '0.5rem solid transparent',
})

export const referenceTextBody = style({})
regulationContentStyling(referenceTextBody)
diffStyling(referenceTextBody)

// Modal header
export const modalHeader = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing[3]}px ${spacing[4]}px`,
  borderBottom: `1px solid ${theme.color.dark200}`,
})
