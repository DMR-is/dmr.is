import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    emptyTitle: {
      id: 'web.components.statistics:notPublished.emptyTitle',
      defaultMessage: 'Engin mál í vinnslu',
      description: 'No data title for the dashboard',
    },
    emptyIntro: {
      id: 'web.components.statistics:notPublished.emptyIntro',
      defaultMessage: 'Í þessari deild eru engin óútgefin mál.',
      description: 'No data intro for the dashboard',
    },
    intro: {
      id: 'web.components.statistics:notPublished.intro',
      defaultMessage: 'Staða óútgefinna mála eftir deildum.',
      description: 'Intro for the dashboard',
    },
    total: {
      id: 'web.components.statistics:notPublished.total',
      defaultMessage: 'Alls',
      description: 'Total label for the dashboard',
    },
  }),
}
