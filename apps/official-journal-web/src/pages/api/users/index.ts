import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'

class UserHandler {
  private readonly client = createDmrClient()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void (await this.get(req, res))
        case 'POST':
          return void (await this.create(req, res))
        default:
          return void res.status(405).end()
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const users = await this.client.getUsers()

    return res.status(200).json(users)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    const user = await this.client.createUser({
      createAdminUser: {
        displayName: req.body.displayName,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        nationalId: req.body.nationalId,
        roleIds: req.body.roleIds,
      },
    })

    return res.status(201).json(user)
  }
}

const instance = new UserHandler()

export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
