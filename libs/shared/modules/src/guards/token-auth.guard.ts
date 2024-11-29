import * as jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

@Injectable()
export class TokenJwtAuthGuard implements CanActivate {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  private jwksClient = jwksRsa({
    jwksUri: `https://${process.env.IDENTITY_SERVER_DOMAIN}/.well-known/openid-configuration/jwks`,
    cache: true,
    rateLimit: true,
  })

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

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
      request.user = payload // Attach the decoded payload to request

      return true
    } catch (error) {
      this.logger.error('Verification Error:', error)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
