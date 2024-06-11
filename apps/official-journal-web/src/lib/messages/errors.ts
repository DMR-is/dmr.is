import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  noDataTitle: {
    id: 'web.page.errors.noDataTitle',
    defaultMessage: 'Villa kom upp',
    description: 'No data title',
  },
  noDataText: {
    id: 'web.page.errors.noDataText',
    defaultMessage: 'Villa kom upp við að sækja gögn',
    description: 'No data text',
  },
  errorFetchingData: {
    id: 'web.page.errors.errorFetchingData',
    defaultMessage: 'Villa kom upp við að sækja gögn',
    description: 'Error fetching data',
  },
  internalServerError: {
    id: 'web.page.errors.internalServerError',
    defaultMessage: 'Innri kerfisvilla kom upp',
    description: 'Internal server error',
  },
})
