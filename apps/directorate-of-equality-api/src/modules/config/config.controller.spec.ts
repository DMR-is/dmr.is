import { type IConfigService } from '@dmr.is/doe-modules/config'
import { type UserModel } from '@dmr.is/doe-modules/user'

import { ConfigController } from './config.controller'

describe('ConfigController', () => {
  it('passes the admin the guards resolved as the actor, never anything from the body', async () => {
    const updateByKey = jest.fn().mockResolvedValue({ id: 'config-2' })
    const controller = new ConfigController({
      updateByKey,
    } as unknown as IConfigService)
    const body = {
      value: '3.5',
      // A body cannot name the actor: the DTO has no such field, and an extra
      // one is ignored here.
      actorUserId: 'someone-else',
    } as never

    await controller.updateByKey('salary_difference_threshold_percent', body, {
      adminUser: { id: 'admin-1' } as UserModel,
    })

    expect(updateByKey).toHaveBeenCalledWith(
      'salary_difference_threshold_percent',
      body,
      'admin-1',
    )
  })
})
