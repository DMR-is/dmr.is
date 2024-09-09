import { logger } from '@dmr.is/logging'
import { BadRequestException, ValidationPipe } from '@nestjs/common'

export const ExceptionFactoryPipe = () =>
  new ValidationPipe({
    exceptionFactory(errors) {
      const errs = errors.map((error) => {
        const target = error.target?.constructor.name
        logger.warn(
          `Application API validation error: ${target}.${error.property} received<${error.value}>`,
          {
            constraints: error.constraints,
            children: error.children,
          },
        )

        return {
          property: error.property,
          constraints: error.constraints,
        }
      })
      return new BadRequestException(errs)
    },
    transform: true,
    // stopAtFirstError: true,
  })
