import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    searchPlaceholder: {
      id: 'web.components.caseFilters:searchPlaceholder',
      defaultMessage: 'Leita eftir málsnafni',
      description: 'Search placeholder for case filters',
    },
    filters: {
      id: 'web.components.caseFilters:filters',
      defaultMessage: 'Síur',
      description: '',
    },
    openFilter: {
      id: 'web.components.caseFilters:openFilter',
      defaultMessage: 'Opna síun',
      description: 'Open filter button label for case filters',
    },
    filterLabel: {
      id: 'web.components.caseFilters:filterLabel',
      defaultMessage: 'Síun á lista:',
      description: '',
    },
    clearAllFilters: {
      id: 'web.components.caseFilters:clearAllFilters',
      defaultMessage: 'Hreinsa allar síur',
      description: 'Clear all filters button label',
    },
  }),
}
