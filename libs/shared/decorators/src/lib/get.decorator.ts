/* eslint-disable @typescript-eslint/no-explicit-any */

import { MethodNotAllowedException } from '@nestjs/common'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Get(message: string | undefined = 'Internal server error') {
  return function (
    target: any,
    method: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      if (args[0].method !== 'GET') {
        throw new MethodNotAllowedException()
      }

      return await originalMethod.apply(this, args)
    }
    return descriptor
  }
}
