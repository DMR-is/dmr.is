import { defineMessages } from 'react-intl'

export const messages = {
  empty: defineMessages({
    title: {
      id: 'web.components.adverts-overview-list.empty.title',
      defaultMessage: 'Engin mál fundust',
      description: 'Title for empty state',
    },
    editorial: {
      id: 'web.components.adverts-overview-list.empty.editorial',
      defaultMessage: 'Sem stendur eru engin mál sem teljast almenn',
      description: 'Editorial empty state',
    },
    published: {
      id: 'web.components.adverts-overview-list.empty.published',
      defaultMessage: 'Sem stendur eru engin mál sem bíða útgáfu',
      description: 'Published empty state',
    },
    assigned: {
      id: 'web.components.adverts-overview-list.empty.assigned',
      defaultMessage: 'Sem stendur eru engin mál sem teljast þín mál',
      description: 'Assigned empty state',
    },
    inactive: {
      id: 'web.components.adverts-overview-list.empty.inactive',
      defaultMessage: 'Sem stendur eru engin mál sem teljast óhreyfð',
      description: 'Inactive empty state',
    },
  }),
}
