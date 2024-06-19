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
  errorFetchingDepartmentsMessage: {
    id: 'web.page.errors.errorFetchingDepartmentsMessage',
    defaultMessage: 'Ekki tókst að sækja deildir',
    description: 'Error fetching departments',
  },
  errorFetchingTypesMessage: {
    id: 'web.page.errors.errorFetchingTypesMessage',
    defaultMessage: 'Ekki tókst að sækja tegundir mála',
    description: 'Error fetching types',
  },
  errorFetchingCategoriesMessage: {
    id: 'web.page.errors.errorFetchingCategoriesMessage',
    defaultMessage: 'Ekki tókst að sækja flokka mála',
    description: 'Error fetching categories',
  },
})
