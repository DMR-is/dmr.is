import { Controller, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard, RoleGuard } from '@dmr.is/official-journal/guards'
import { Roles } from '@dmr.is/decorators'

@Controller({
  path: 'categories',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class CategoryAdminController {}
