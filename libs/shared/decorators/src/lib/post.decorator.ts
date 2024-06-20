/* eslint-disable @typescript-eslint/no-explicit-any */

import { MethodNotAllowedException } from '@nestjs/common'

export function Post(message: string | undefined = 'Internal server error') {
  return function (
    target: any,
    method: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      if (args[0].method !== 'POST') {
        throw new MethodNotAllowedException()
      }

      return await originalMethod.apply(this, args)
    }
    return descriptor
  }
}
