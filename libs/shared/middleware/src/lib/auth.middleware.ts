import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'

@Injectable()
export class WithAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { headers } = req

    const token = headers.authorization

    if (!token) {
      throw new UnauthorizedException()
    }

    const auth = token.split(' ')[1]

    if (!auth) {
      throw new UnauthorizedException(`No token provided`)
    }

    req.headers.token = auth

    // TODO: Get verify token later, we need a secret from island.is team to verify the token
    // const verified = verify(auth, process.env.ISLAND_IS_CLIENT_SECRET!, {
    //   algorithms: ['RS256'],
    // })

    // if (!verified) {
    //   throw new UnauthorizedException(`Invalid token`)
    // }

    // if (typeof verified === 'string') {
    //   throw new UnauthorizedException(`Invalid token`)
    // }

    // for now we just return the token for the @Auth decorator to decode

    next()
  }
}
