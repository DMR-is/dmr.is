import * as jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { LogMethod } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

type UserFromIdToken = {
  name: string
  actor?: {
    name: string
  }
}

@Injectable()
export class TokenJwtAuthGuard implements CanActivate {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  private jwksClient = jwksRsa({
    jwksUri: `https://${process.env.IDENTITY_SERVER_DOMAIN}/.well-known/openid-configuration/jwks`,
    cache: true,
    rateLimit: true,
  })

  private userInfoFromIdToken(
    idToken: string,
    publicKey: string,
    accessTokenSub?: string,
  ): UserFromIdToken | null {
    try {
      const payload = jwt.verify(idToken, publicKey, {
        clockTolerance: 20, // 20 seconds clock tolerance
        algorithms: ['RS256'],
      }) as jwt.JwtPayload
      if (payload.sub !== accessTokenSub) {
        this.logger.error('ID Token sub does not match Access Token sub')
        return null
      }
      return {
        name: payload.name,
        actor: payload.actor,
      }
    } catch (error) {
      this.logger.error('ID Token Verification Error:', error)
      return null
    }
  }

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing')
    }

    const multipleTokens = authHeader.split(',')
    const tokens = multipleTokens.map((token: string) => {
      return token.replace('Bearer ', '').trim()
    })

    // Added support to have access and idtoken in the authorization header
    // This gives us the ability to get scopes from access token and user info from id token
    const token = tokens[0] // Use the first token for verification
    const idToken = tokens[1] // Use the second token for ID token verification
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
      const payload = jwt.verify(token, publicKey, {
        issuer: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
        algorithms: ['RS256'],
        clockTolerance: 20, // 20 seconds clock tolerance
      }) as jwt.JwtPayload
      const user = idToken
        ? this.userInfoFromIdToken(tokens[1], publicKey, payload.sub as string)
        : null
      const actor = payload.actor
        ? {
            ...payload.actor,
            name: user?.actor?.name || payload.actor?.name,
          }
        : undefined
      request.user = {
        ...payload, // Attach the decoded payload to request
        actor: actor,
        name: user?.name || payload.name,
      }

      return true
    } catch (error) {
      this.logger.error('Verification Error:', error)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
