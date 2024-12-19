import { PartialType } from '@nestjs/swagger'

import { CreateAdminUser } from './create-admin-user.dto'

export class UpdateAdminUser extends PartialType(CreateAdminUser) {}
