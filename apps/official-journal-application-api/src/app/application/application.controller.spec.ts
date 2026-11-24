import {
  ApplicationOwnershipGuard,
  InvolvedPartyGuard,
  OwnInvolvedPartyGuard,
} from '@dmr.is/ojoi-modules'

import { ApplicationController } from './application.controller'

const guardsOf = (method: keyof ApplicationController) =>
  (Reflect.getMetadata('__guards__', ApplicationController.prototype[method]) ??
    []) as unknown[]

describe('ApplicationController guards', () => {
  it.each([
    'getPrice',
    'getApplication',
    'postApplication',
    'uploadApplicationAttachment',
    'getPresignedUrl',
    'addApplicationAttachment',
    'getApplicationAttachments',
    'deleteApplicationAttachment',
  ] as const)('%s requires the caller to be a party', (method) => {
    expect(guardsOf(method)).toContain(ApplicationOwnershipGuard)
  })

  it("limits the signature route to the caller's own involved parties", () => {
    expect(guardsOf('getSignaturesForInvolvedParty')).toContain(
      OwnInvolvedPartyGuard,
    )
  })

  it.each(['getComments', 'postComment', 'getApplicationCase'] as const)(
    '%s stays on the case-based involved party guard',
    (method) => {
      expect(guardsOf(method)).toEqual([InvolvedPartyGuard])
    },
  )
})
