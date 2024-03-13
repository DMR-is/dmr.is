import { CaseCommentType, CaseStatus } from '../dto/case/case-constants'
import { Case } from '../dto/case/case.dto'
import { ADVERT_B_1278_2023 } from './journal.mock'

export const CASE_SUBMITTED: Case = {
  id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
  applicationId: '3ec5ef68-6dc8-42ee-9eba-1670ff134153',
  year: 2024,
  caseNumber: '01905',
  publishingNumber: null,
  status: CaseStatus.Submitted,
  tag: null,
  createdAt: '2024-03-12T12:45:48.21Z',
  modifiedAt: '2024-03-12T12:45:48.21Z',
  published: false,
  publishedAt: null,
  paid: false,
  price: null,
  fastTrack: false,
  insititution: {
    name: 'Dómsmálaráðuneytið',
    ssn: '5804170510',
  },
  assignedTo: null,
  advert: ADVERT_B_1278_2023,
  comments: [
    {
      id: '76caef40-c98d-40bf-9c78-76832d2ea1d1',
      type: CaseCommentType.Submit,
      createdAt: '2024-03-12T12:45:48.21Z',
      task: {
        from: null,
        to: 'Stofnun x',
        title: 'Innsent af:',
        comment: null,
      },
    },
    {
      id: 'a72e9b33-ad8c-4d83-84bf-92e109721e0f',
      createdAt: '2024-03-13T12:45:48.21Z',
      type: CaseCommentType.Assign,
      task: {
        from: 'Ármann',
        to: null,
        title: 'merkir sér málið',
        comment: null,
      },
    },
    {
      id: 'fb85443f-1d10-4c7c-bef3-d1b8dbc1d462',
      type: CaseCommentType.Comment,
      createdAt: '2024-03-13T12:45:48.21Z',
      task: {
        from: 'Ármann',
        to: null,
        title: 'gerir athugasemd',
        comment:
          'Pálína, getur þú tekið við og staðfest að upplýsingarnar séu réttar?',
      },
    },
  ],
}

export const ALL_MOCK_CASES: Case[] = [CASE_SUBMITTED]
