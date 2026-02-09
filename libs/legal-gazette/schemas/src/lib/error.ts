type ParsedError = {
  path: string
  message: string
}

export const parseZodError = (errors: any, parentPath = ''): ParsedError[] => {
  const result: ParsedError[] = []

  const traverse = (obj: any, currentPath: string) => {
    if (!obj || typeof obj !== 'object') return

    if (obj.message && typeof obj.message === 'string') {
      try {
        const parsed = JSON.parse(obj)

        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            traverse(item, currentPath)
          })
        }
      } catch (e) {
        // ignore
      }

      result.push({
        path: obj?.path?.join('.'),
        message: obj.message,
      })
      return
    }

    // Recursively traverse nested objects
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key
      traverse(value, newPath)
    })
  }

  traverse(errors, parentPath)

  return result
}
