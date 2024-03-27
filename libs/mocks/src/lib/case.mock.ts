import {
  Case,
  CaseStatus,
  CaseCommentType,
  CaseTag,
  CaseCommentTitle,
} from '@dmr.is/shared/dto'
import {
  ADVERT_B_1278_2023,
  ADVERT_B_866_2006,
  ADVERT_NEW,
} from './journal.mock'

export const CASE_SUBMITTED: Case = {
  id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
  applicationId: '3ec5ef68-6dc8-42ee-9eba-1670ff134153',
  year: 2024,
  caseNumber: 1234,
  status: CaseStatus.Submitted,
  tag: null,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: false,
  price: null,
  fastTrack: false,
  assignedTo: null,
  advert: ADVERT_NEW,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
      type: CaseCommentType.Submit,
      createdAt: '2024-03-12T12:45:48.21Z',
      caseStatus: CaseStatus.Submitted,
      task: {
        from: null,
        to: 'Stofnun x',
        title: CaseCommentTitle.Submit,
        comment: null,
      },
    },
  ],
}

export const CASE_IN_PROGRESS: Case = {
  id: 'e6d7c050-a462-4183-972a-5c375e6e358d',
  applicationId: '3ec5ef68-6dc8-42ee-9eha-1670ff134153',
  year: 2024,
  caseNumber: 8526,
  status: CaseStatus.InProgress,
  tag: null,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: false,
  price: null,
  fastTrack: false,
  assignedTo: null,
  advert: ADVERT_B_1278_2023,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2xa1d1',
      type: CaseCommentType.Submit,
      createdAt: '2024-03-12T12:45:48.21Z',
      caseStatus: CaseStatus.Submitted,
      task: {
        from: null,
        to: 'Stofnun x',
        title: CaseCommentTitle.Submit,
        comment: null,
      },
    },
    {
      id: 'a72e9b33-ad8c-4a83-84bf-92e109721e0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: CaseCommentType.Assign,
      caseStatus: CaseStatus.Submitted,
      task: {
        from: 'Ármann',
        to: null,
        title: CaseCommentTitle.AssignSelf,
        comment: null,
      },
    },
    {
      id: 'fb85443f-1d10-4c7c-bef3-d1b8dkc1d462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      caseStatus: CaseStatus.InProgress,
      task: {
        from: 'Ármann',
        to: 'Grunnvinnsla',
        title: CaseCommentTitle.UpdateStatus,
        comment: null,
      },
    },
    {
      id: 'fb85443f-1d10-4c7c-bef3-d1b8dkc1d462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      caseStatus: CaseStatus.InProgress,
      task: {
        from: 'Ármann',
        to: null,
        title: CaseCommentTitle.Comment,
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const CASE_IN_REVIEW: Case = {
  id: 'e637c050-a462-4183-972a-5c375e6e34ad',
  applicationId: '3ec5ef68-6dc8-42ee-9eba-1670ff134z53',
  year: 2024,
  caseNumber: 5824,
  status: CaseStatus.InReview,
  tag: CaseTag.InReview,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: true,
  price: 23900,
  fastTrack: false,
  assignedTo: 'Pálína J',
  advert: ADVERT_B_866_2006,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
      type: CaseCommentType.Submit,
      createdAt: '2024-03-12T12:45:48.21Z',
      caseStatus: CaseStatus.Submitted,
      task: {
        from: null,
        to: 'Stofnun x',
        title: CaseCommentTitle.Submit,
        comment: null,
      },
    },
    {
      id: 'a72e9b33-ad8c-4d83-84bf-92e109721z0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: CaseCommentType.Assign,
      caseStatus: CaseStatus.Submitted,
      task: {
        from: 'Ármann',
        to: null,
        title: CaseCommentTitle.AssignSelf,
        comment: null,
      },
    },
    {
      id: 'fb85443f-1d10-4c7c-bef3-d1b8dkc1d462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      caseStatus: CaseStatus.InProgress,
      task: {
        from: 'Ármann',
        to: 'Grunnvinnsla',
        title: CaseCommentTitle.UpdateStatus,
        comment: null,
      },
    },
    {
      id: 'jk85443f-1d10-4c7c-bef3-d1b8dbc1d462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      caseStatus: CaseStatus.InProgress,
      task: {
        from: 'Ármann',
        to: null,
        title: CaseCommentTitle.Comment,
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const CASE_READY: Case = {
  id: 'e637c050-a462-4183-972a-5c375x6e34ad',
  applicationId: '3ec5ef68-6dc8-42xe-9eba-1670ff134z53',
  year: 2024,
  caseNumber: 3211,
  status: CaseStatus.ReadyForPublishing,
  tag: CaseTag.MultipleReviewers,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: true,
  price: 23000,
  fastTrack: false,
  assignedTo: 'Ármann',
  advert: ADVERT_B_866_2006,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-7683ad2ea1d1',
      type: CaseCommentType.Submit,
      createdAt: '2024-03-12T12:45:48.21Z',
      caseStatus: CaseStatus.Submitted,
      task: {
        from: null,
        to: 'Stofnun x',
        title: CaseCommentTitle.Submit,
        comment: null,
      },
    },
    {
      id: 'a72e9x33-ad8c-4d83-84bf-92e10972kz0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: CaseCommentType.Assign,
      caseStatus: CaseStatus.Submitted,
      task: {
        from: 'Ármann',
        to: null,
        title: CaseCommentTitle.AssignSelf,
        comment: null,
      },
    },
    {
      id: 'fb85443f-1d10-4c7c-bef3-d1b8dkc1d462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      caseStatus: CaseStatus.InProgress,
      task: {
        from: 'Ármann',
        to: 'Grunnvinnsla',
        title: CaseCommentTitle.UpdateStatus,
        comment: null,
      },
    },
    {
      id: 'jk85443f-1d10-4c7c-bef3-d1b8dbcld462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      caseStatus: CaseStatus.InProgress,
      task: {
        from: 'Ármann',
        to: null,
        title: CaseCommentTitle.Comment,
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const ALL_MOCK_CASES = [
  CASE_SUBMITTED,
  CASE_IN_PROGRESS,
  CASE_IN_REVIEW,
  CASE_READY,
]
