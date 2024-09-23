import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common'
import { decode } from 'jsonwebtoken'

export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.token

    const user = decode(token)

    if (!user || typeof user === 'string') {
      throw new UnauthorizedException('Unauthorized')
    }

    const nationalId = user.nationalId

    if (!nationalId) {
      throw new UnauthorizedException('Unauthorized')
    }

    request.nationalId = nationalId

    // lookup user and find out if they are allowed to access the resource

    return true
  }
}
