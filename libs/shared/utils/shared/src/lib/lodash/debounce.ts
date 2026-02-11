/**
 * Native replacement for lodash/debounce.
 * Delays invoking `func` until after `wait` milliseconds have elapsed
 * since the last time the debounced function was invoked.
 */

type AnyFunction = (...args: never[]) => unknown

interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function debounce<T extends AnyFunction>(
  func: T,
  wait: number,
  immediate?: boolean,
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    if (immediate && !timeout) {
      func.apply(this, args)
    }

    timeout = setTimeout(() => {
      timeout = null
      if (!immediate) {
        func.apply(this, args)
      }
    }, wait)
  } as DebouncedFunction<T>

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}

export default debounce
