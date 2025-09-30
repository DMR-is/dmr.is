import { CanActivate, ExecutionContext } from '@nestjs/common'

export class MachineClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    return (
      user &&
      user.scope &&
      user.scope.includes(process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES)
    )
  }
}
