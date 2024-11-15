/* eslint-disable no-console */
import * as jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { ROLES_KEY } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdminUserRoleTitle } from '@dmr.is/types'

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IAdminUserService } from '../admin-user/admin-user.service.interface'

const LOGGING_CATEGORY = 'admin-auth-guard'

@Injectable()
export class SimpleJwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IAdminUserService)
    private readonly adminUserService: IAdminUserService,
  ) {}
  private jwksClient = jwksRsa({
    jwksUri: `${process.env.IDENTITY_SERVER_DOMAIN}/.well-known/openid-configuration/jwks`,
    cache: true,
    rateLimit: true,
  })

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    const requiredRoles = this.reflector.get<AdminUserRoleTitle[]>(
      ROLES_KEY,
      context.getHandler(),
    )

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new UnauthorizedException('Token is missing')
    }

    try {
      // Decode header to get key ID (kid)
      const decodedHeader = jwt.decode(token, { complete: true })?.header

      if (!decodedHeader) {
        throw new Error('Invalid access token header')
      }

      const key = await this.jwksClient.getSigningKey(decodedHeader.kid)
      const publicKey = key.getPublicKey()

      // Verify the token with the public key
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] })
      console.log('Decoded Payload:', payload)
      request.user = payload // Attach the decoded payload to request

      // Check if user has required roles
      const roleLookup = await this.adminUserService.checkIfUserHasRole(
        request.user.nationalId,
        requiredRoles,
      )

      if (!roleLookup.result.ok) {
        this.logger.warn('Could not get user roles', {
          error: roleLookup.result.error,
          category: LOGGING_CATEGORY,
        })

        if (roleLookup.result.error.code === 500) {
          throw new InternalServerErrorException()
        }

        if (roleLookup.result.error.code === 404) {
          throw new UnauthorizedException()
        }

        throw new ForbiddenException()
      }

      if (!roleLookup.result.value.hasRole) {
        throw new UnauthorizedException(
          'Invalid role provided, required role: ' + requiredRoles,
        )
      }

      return true
    } catch (error) {
      console.error('Verification Error:', error)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
