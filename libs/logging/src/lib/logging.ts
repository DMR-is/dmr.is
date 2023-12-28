import { ConsoleLogger } from '@nestjs/common'

export class CustomLogger extends ConsoleLogger {}

export const logger = new CustomLogger()
