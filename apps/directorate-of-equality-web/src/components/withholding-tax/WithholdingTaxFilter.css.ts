import { style } from '@vanilla-extract/css'

// Pulls the selects up to overlap the Filter component's bottom border, like
// the date section in ReportFilter.
export const selectSection = style({
  marginTop: '-32px',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
})

// Until a year is fetched there is nothing to filter: the fieldset disables
// every native control inside, and this resets its default chrome and dims it.
export const fieldset = style({
  border: 0,
  margin: 0,
  padding: 0,
  minWidth: 0,
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  },
})
