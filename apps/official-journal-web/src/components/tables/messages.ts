import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    openCaseLinkText: {
      id: 'web.components.tables:openCaseLinkText',
      defaultMessage: 'Sjá nánar',
      description: 'See more link',
    },
    emptyTable: {
      id: 'web.components.tables:emptyTable',
      defaultMessage: 'Engin mál finnast, líklega þarf að breyta síun.',
      description: 'Empty table message',
    },
  }),
  tables: {
    submitted: {
      columns: defineMessages({
        publicationDate: {
          id: 'web.components.tables:submitted.columns.publicationDate',
          defaultMessage: 'Birting',
          description: 'Publication date column',
        },
        registrationDate: {
          id: 'web.components.tables:submitted.columns.registrationDate',
          defaultMessage: 'Skráning',
          description: 'Registration date column',
        },
        department: {
          id: 'web.components.tables:submitted.columns.department',
          defaultMessage: 'Deild',
          description: 'Department column',
        },
        title: {
          id: 'web.components.tables:submitted.columns.title',
          defaultMessage: 'Heiti',
          description: 'Title column',
        },
      }),
    },
    inProgress: {
      columns: defineMessages({
        publishDate: {
          id: 'web.components.tables:inProgress.columns.publishDate',
          defaultMessage: 'Birting',
          description: 'Publish date column',
        },
        registrationDate: {
          id: 'web.components.tables:inProgress.columns.registrationDate',
          defaultMessage: 'Skráning',
          description: 'Registration date column',
        },
        department: {
          id: 'web.components.tables:inProgress.columns.department',
          defaultMessage: 'Deild',
          description: 'Department column',
        },
        title: {
          id: 'web.components.tables:inProgress.columns.title',
          defaultMessage: 'Heiti',
          description: 'Title column',
        },
        employee: {
          id: 'web.components.tables:inProgress.columns.employee',
          defaultMessage: 'Starfs.',
          description: 'Employee column',
        },
      }),
    },
    inReview: {
      columns: defineMessages({
        publishDate: {
          id: 'web.components.tables:inReview.columns.publishDate',
          defaultMessage: 'Birting',
          description: 'Publish date column',
        },
        registrationDate: {
          id: 'web.components.tables:inReview.columns.registrationDate',
          defaultMessage: 'Skráning',
          description: 'Registration date column',
        },
        department: {
          id: 'web.components.tables:inReview.columns.department',
          defaultMessage: 'Deild',
          description: 'Department column',
        },
        title: {
          id: 'web.components.tables:inReview.columns.title',
          defaultMessage: 'Heiti',
          description: 'Title column',
        },
        employee: {
          id: 'web.components.tables:inReview.columns.employee',
          defaultMessage: 'Starfs.',
          description: 'Employee column',
        },
        tags: {
          id: 'web.components.tables:inReview.columns.tag',
          defaultMessage: 'Merking',
          description: 'Tag column',
        },
      }),
    },
    ready: {
      columns: defineMessages({
        title: {
          id: 'web.components.tables:ready.columns.title',
          defaultMessage: 'Heiti',
          description: 'Title column',
        },
        publicationDate: {
          id: 'web.components.tables:ready.columns.publicationDate',
          defaultMessage: 'Birtingardagur',
          description: 'Publication date column',
        },
        institution: {
          id: 'web.components.tables:ready.columns.institution',
          defaultMessage: 'Stofnun',
          description: 'Institution column',
        },
      }),
    },
    selectedCases: {
      empty: defineMessages({
        message: {
          id: 'web.components.tables:selectedCases.empty.message',
          defaultMessage: 'Engin mál valin.',
          description: 'No cases selected message',
        },
      }),
      columns: defineMessages({
        title: {
          id: 'web.components.tables:selectedCases.columns.title',
          defaultMessage: 'Heiti',
          description: 'Title column',
        },
        number: {
          id: 'web.components.tables:selectedCases.columns.number',
          defaultMessage: 'Númer',
          description: 'Number column',
        },
        institution: {
          id: 'web.components.tables:selectedCases.columns.institution',
          defaultMessage: 'Stofnun',
          description: 'Institution column',
        },
      }),
    },
    overview: {
      columns: defineMessages({
        publishDate: {
          id: 'web.components.tables:overview.columns.publishDate',
          defaultMessage: 'Útgáfudagur',
          description: 'Publish date column',
        },
        status: {
          id: 'web.components.tables:overview.columns.status',
          defaultMessage: 'Staða/Nr.',
          description: 'Status column',
        },
        title: {
          id: 'web.components.tables:overview.columns.title',
          defaultMessage: 'Heiti',
          description: 'Title column',
        },
        institution: {
          id: 'web.components.tables:overview.columns.institution',
          defaultMessage: 'Stofnun',
          description: 'Institution column',
        },
      }),
    },
  },
}