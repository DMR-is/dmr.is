type ParsedError = {
  path: string
  message: string
}

export const parseFormstateErrors = (
  errors: any,
  parentPath = '',
): ParsedError[] => {
  const result: ParsedError[] = []

  const traverse = (obj: any, currentPath: string) => {
    if (!obj || typeof obj !== 'object') return

    // Check if this object has a message property (it's an error)
    if (obj.message && typeof obj.message === 'string') {
      result.push({
        path: obj.ref?.name || currentPath,
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
