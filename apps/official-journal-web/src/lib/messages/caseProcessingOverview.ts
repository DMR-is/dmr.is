import { defineMessages } from 'react-intl'

export const messages = {
  tabs: defineMessages({
    statuses: {
      id: 'web.page.caseProcessingOverview:tabs.statuses',
      defaultMessage: 'Stöður',
      description: '',
    },
    submitted: {
      id: 'web.page.caseProcessingOverview:tabs.submitted',
      defaultMessage: 'Innsendingar ({count})',
      description: 'Tab label for submitted cases',
    },
    inProgress: {
      id: 'web.page.caseProcessingOverview:tabs.inProgress',
      defaultMessage: 'Grunnvinnsla ({count})',
      description: 'Tab label for cases in progress',
    },
    inReview: {
      id: 'web.page.caseProcessingOverview:tabs.inReview',
      defaultMessage: 'Yfirlestur ({count})',
      description: 'Tab label for cases in review',
    },
    ready: {
      id: 'web.page.caseProcessingOverview:tabs.ready',
      defaultMessage: 'Tilbúið ({count})',
      description: 'Tab label for cases ready',
    },
    submittedNoCount: {
      id: 'web.page.caseProcessingOverview:tabs.submittedNoCount',
      defaultMessage: 'Innsendingar',
      description: 'Tab label for submitted cases',
    },
    inProgressNoCount: {
      id: 'web.page.caseProcessingOverview:tabs.inProgressNoCount',
      defaultMessage: 'Grunnvinnsla',
      description: 'Tab label for cases in progress',
    },
    inReviewNoCount: {
      id: 'web.page.caseProcessingOverview:tabs.inReviewNoCount',
      defaultMessage: 'Yfirlestur',
      description: 'Tab label for cases in review',
    },
    readyNoCount: {
      id: 'web.page.caseProcessingOverview:tabs.readyNoCount',
      defaultMessage: 'Tilbúið',
      description: 'Tab label for cases ready',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.page.caseProcessingOverview:banner.title',
      defaultMessage: 'Vinnslusvæði Stjórnartíðinda',
      description: 'Title for the banner on the case overview page',
    },
    description: {
      id: 'web.page.caseProcessingOverview:banner.description',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis',
      description: 'Description for the banner on the case overview page',
    },
  }),
  breadcrumbs: defineMessages({
    home: {
      id: 'web.page.caseProcessingOverview:breadcrumbs.home',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Breadcrumb for the home page',
    },
    cases: {
      id: 'web.page.caseProcessingOverview:breadcrumbs.cases',
      defaultMessage: 'Ritstjórn',
      description: 'Breadcrumb for the case overview page',
    },
  }),
}
