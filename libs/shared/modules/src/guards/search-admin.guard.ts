import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const token = ctx.switchToHttp().getRequest().headers['x-admin-token']
    if (!token) throw new UnauthorizedException('Missing admin token')
    if (!process.env.ADMIN_API_TOKEN) {
      throw new UnauthorizedException('Admin token not configured on server')
    }
    if (token !== process.env.ADMIN_API_TOKEN)
      throw new UnauthorizedException('Invalid admin token')
    return true
  }
}
