import { defineMessage, defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    caseStatuses: {
      id: 'web.page.dashboard:general.caseStatuses',
      defaultMessage: 'Staða mála',
      description: 'Case statuses heading for the dashboard',
    },
    admin: {
      id: 'web.page.dashboard:general.admin',
      defaultMessage: 'Ritstjórn',
      description: 'Admin heading for the dashboard',
    },
    statistics: {
      id: 'web.page.dashboard:general.statistics',
      defaultMessage: 'Tölfræði',
      description: 'Statistics heading for the dashboard',
    },
    publishing: {
      id: 'web.page.dashboard:general.publishing',
      defaultMessage: 'Útgáfa',
      description: 'Publishing heading for the dashboard',
    },
    openAdmin: {
      id: 'web.page.dashboard:general.openAdmin',
      defaultMessage: 'Opna ritstjórn',
      description: 'Open admin button label for the dashboard',
    },
    openStatistics: {
      id: 'web.page.dashboard:general.openStatistics',
      defaultMessage: 'Sjá alla tölfræði',
      description: 'Open statistics button label for the dashboard',
    },
    openPublishing: {
      id: 'web.page.dashboard:general.openPublishing',
      defaultMessage: 'Opna útgáfuferli',
      description: 'Open publishing button label for the dashboard',
    },
  }),
  tabs: {
    admin: defineMessages({
      general: {
        id: 'web.page.dashboard:tabs.admin.general',
        defaultMessage: 'Almennt',
        description: 'General tab for the dashboard',
      },
      personal: {
        id: 'web.page.dashboard:tabs.admin.personal',
        defaultMessage: 'Mín mál',
        description: 'Personal tab for the dashboard',
      },
      inactive: {
        id: 'web.page.dashboard:tabs.admin.inactive',
        defaultMessage: 'Óhreyfd mál',
        description: 'Inactive tab for the dashboard',
      },
    }),
    statistics: defineMessages({
      a: {
        id: 'web.page.dashboard:tabs.statistics.a',
        defaultMessage: 'A-deild',
        description: 'Department a tab for the dashboard statistics',
      },
      b: {
        id: 'web.page.dashboard:tabs.statistics.b',
        defaultMessage: 'B-deild',
        description: 'Department b tab for the dashboard statistics',
      },
      c: {
        id: 'web.page.dashboard:tabs.statistics.c',
        defaultMessage: 'C-deild',
        description: 'Department c tab for the dashboard statistics',
      },
    }),
  },
  banner: {
    cards: {
      editorial: defineMessages({
        title: {
          id: 'web.page.dashboard:banner.cards.editorial.title',
          defaultMessage: 'Ritstjórn',
          description: 'Title for the editorial card on the dashboard banner',
        },
        description: {
          id: 'web.page.dashboard:banner.cards.editorial.description',
          defaultMessage: 'Umsýsla frá innsendingu til útgáfu.',
          description:
            'Description for the editorial card on the dashboard banner',
        },
      }),
      publishing: defineMessages({
        title: {
          id: 'web.page.dashboard:banner.cards.publishing.title',
          defaultMessage: 'Útgáfa',
          description: 'Title for the publishing card on the dashboard banner',
        },
        description: {
          id: 'web.page.dashboard:banner.cards.publishing.description',
          defaultMessage: 'Úthlutun númera og birting mála.',
          description:
            'Description for the publishing card on the dashboard banner',
        },
      }),
      all: defineMessages({
        title: {
          id: 'web.page.dashboard:banner.cards.all.title',
          defaultMessage: 'Heildarlisti',
          description: 'Title for the all card on the dashboard banner',
        },
        description: {
          id: 'web.page.dashboard:banner.cards.all.description',
          defaultMessage: 'Öll mál, bæði í vinnslu og útgefin.',
          description: 'Description for the all card on the dashboard banner',
        },
      }),
    },
    content: defineMessages({
      title: {
        id: 'web.page.dashboard:banner.title',
        defaultMessage: 'Stjórnartíðindi',
        description: 'Title for the banner on the case overview page',
      },
      description: {
        id: 'web.page.dashboard:banner.description',
        defaultMessage:
          'Umsýslukerfi Stjórnartíðinda, morem ipsum dolor sit amet, consectetur adipiscing elit.',
        description: 'Description for the banner on the case overview page',
      },
    }),
  },
  imageWithText: {
    new: defineMessages({
      title: {
        id: 'web.page.dashboard:imageWithText.new.title',
        defaultMessage: 'Nýskrá auglýsingu',
        description:
          'Title for the new advert image with text on the dashboard',
      },
      description: {
        id: 'web.page.dashboard:imageWithText.new.description',
        defaultMessage:
          'Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        description: 'Description for the new image with text on the dashboard',
      },
      linkText: {
        id: 'web.page.dashboard:imageWithText.new.linkText',
        defaultMessage: 'Nýskrá auglýsingu',
        description: 'Link text for the new image with text on the dashboard',
      },
    }),
    print: defineMessages({
      title: {
        id: 'web.page.dashboard:imageWithText.print.title',
        defaultMessage: 'Prentvæn útgáfa',
        description: 'Title for the print image with text on the dashboard',
      },
      description: {
        id: 'web.page.dashboard:imageWithText.print.description',
        defaultMessage:
          'Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        description:
          'Description for the print image with text on the dashboard',
      },
      linkText: {
        id: 'web.page.dashboard:imageWithText.print.linkText',
        defaultMessage: 'Sækja prentútgáfu',
        description: 'Link text for the print image with text on the dashboard',
      },
    }),
  },
}
