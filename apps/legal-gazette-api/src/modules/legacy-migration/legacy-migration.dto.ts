import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CheckLegacyEmailDto {
  @ApiProperty({
    description: 'Email address to check in the legacy system',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string
}

export class CheckLegacyEmailResponseDto {
  @ApiProperty({
    description: 'Whether the email exists in the legacy system',
    example: true,
  })
  exists!: boolean

  @ApiProperty({
    description: 'Whether the legacy account has an associated kennitala',
    example: false,
  })
  hasKennitala!: boolean
}

export class RequestMigrationDto {
  @ApiProperty({
    description:
      'Legacy email address to send the magic link to. Must exist in the legacy system.',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string
}

export class CompleteMigrationDto {
  @ApiProperty({
    description:
      'Magic link token received via email. Must be valid and not expired.',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  token!: string
}
