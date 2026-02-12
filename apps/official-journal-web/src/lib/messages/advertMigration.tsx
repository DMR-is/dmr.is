import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    backToMigration: {
      id: 'web.page.advertMigration:general.backToMigration',
      defaultMessage: 'Til baka',
      description: 'Back button label',
    },
  }),
  breadcrumbs: defineMessages({
    dashboard: {
      id: 'web.page.advertMigration:breadcrumbs.dashboard',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Dashboard breadcrumb',
    },
    advertMigration: {
      id: 'web.page.advertMigration:breadcrumbs.advertMigration',
      defaultMessage: 'Auglýsing til ritstjórnar',
      description: 'Advert migration breadcrumb',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.page.advertMigration:banner.title',
      defaultMessage: 'Auglýsing til ritstjórnar',
      description: 'Banner title',
    },
    description: {
      id: 'web.page.advertMigration:banner.description',
      defaultMessage:
        'Flytja auglýsingar úr gamla kerfinu yfir í ritstjórnarkerfi.',
      description: 'Banner description',
    },
  }),
}
