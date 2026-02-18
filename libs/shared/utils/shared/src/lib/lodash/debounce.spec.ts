import lodashDebounce from 'lodash/debounce'

import { debounce } from './debounce'
beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})
describe('debounce', () => {
  describe('basic debouncing (parity with lodash)', () => {
    it('should delay invocation until after wait period', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 200)
      const nativeDebounced = debounce(nativeFn, 200)
      lodashDebounced()
      nativeDebounced()
      expect(lodashFn).not.toHaveBeenCalled()
      expect(nativeFn).not.toHaveBeenCalled()
      jest.advanceTimersByTime(200)
      expect(lodashFn).toHaveBeenCalledTimes(1)
      expect(nativeFn).toHaveBeenCalledTimes(1)
    })
    it('should only invoke once for rapid calls', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 100)
      const nativeDebounced = debounce(nativeFn, 100)
      for (let i = 0; i < 5; i++) {
        lodashDebounced()
        nativeDebounced()
        jest.advanceTimersByTime(50)
      }
      jest.advanceTimersByTime(100)
      expect(nativeFn).toHaveBeenCalledTimes(lodashFn.mock.calls.length)
    })
    it('should pass arguments to the debounced function', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 100)
      const nativeDebounced = debounce(nativeFn, 100)
      lodashDebounced('a', 1)
      nativeDebounced('a', 1)
      jest.advanceTimersByTime(100)
      expect(nativeFn).toHaveBeenCalledWith(...lodashFn.mock.calls[0])
      expect(nativeFn).toHaveBeenCalledWith('a', 1)
    })
    it('should use the last call arguments when called multiple times', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 100)
      const nativeDebounced = debounce(nativeFn, 100)
      lodashDebounced('first')
      nativeDebounced('first')
      lodashDebounced('second')
      nativeDebounced('second')
      lodashDebounced('third')
      nativeDebounced('third')
      jest.advanceTimersByTime(100)
      expect(lodashFn).toHaveBeenCalledWith('third')
      expect(nativeFn).toHaveBeenCalledWith('third')
    })
    it('should allow separate invocations after wait period elapses', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 100)
      const nativeDebounced = debounce(nativeFn, 100)
      lodashDebounced('first')
      nativeDebounced('first')
      jest.advanceTimersByTime(100)
      lodashDebounced('second')
      nativeDebounced('second')
      jest.advanceTimersByTime(100)
      expect(lodashFn).toHaveBeenCalledTimes(2)
      expect(nativeFn).toHaveBeenCalledTimes(2)
      expect(nativeFn).toHaveBeenNthCalledWith(1, 'first')
      expect(nativeFn).toHaveBeenNthCalledWith(2, 'second')
    })
  })
  describe('immediate mode (leading edge)', () => {
    it('should invoke immediately on first call', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 200, {
        leading: true,
        trailing: false,
      })
      const nativeDebounced = debounce(nativeFn, 200, true)
      lodashDebounced()
      nativeDebounced()
      expect(lodashFn).toHaveBeenCalledTimes(1)
      expect(nativeFn).toHaveBeenCalledTimes(1)
    })
    it('should not invoke again during wait period', () => {
      const nativeFn = jest.fn()
      const nativeDebounced = debounce(nativeFn, 200, true)
      nativeDebounced()
      expect(nativeFn).toHaveBeenCalledTimes(1)
      nativeDebounced()
      nativeDebounced()
      expect(nativeFn).toHaveBeenCalledTimes(1)
    })
    it('should allow re-invocation after wait period', () => {
      const nativeFn = jest.fn()
      const nativeDebounced = debounce(nativeFn, 200, true)
      nativeDebounced()
      expect(nativeFn).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(200)
      nativeDebounced()
      expect(nativeFn).toHaveBeenCalledTimes(2)
    })
  })
  describe('cancel', () => {
    it('should prevent pending invocation', () => {
      const lodashFn = jest.fn()
      const nativeFn = jest.fn()
      const lodashDebounced = lodashDebounce(lodashFn, 200)
      const nativeDebounced = debounce(nativeFn, 200)
      lodashDebounced()
      nativeDebounced()
      lodashDebounced.cancel()
      nativeDebounced.cancel()
      jest.advanceTimersByTime(200)
      expect(lodashFn).not.toHaveBeenCalled()
      expect(nativeFn).not.toHaveBeenCalled()
    })
    it('should be safe to call cancel when nothing is pending', () => {
      const nativeFn = jest.fn()
      const nativeDebounced = debounce(nativeFn, 200)
      expect(() => nativeDebounced.cancel()).not.toThrow()
    })
    it('should allow new calls after cancel', () => {
      const nativeFn = jest.fn()
      const nativeDebounced = debounce(nativeFn, 100)
      nativeDebounced('cancelled')
      nativeDebounced.cancel()
      nativeDebounced('kept')
      jest.advanceTimersByTime(100)
      expect(nativeFn).toHaveBeenCalledTimes(1)
      expect(nativeFn).toHaveBeenCalledWith('kept')
    })
  })
  describe('this context', () => {
    it('should preserve this context', () => {
      const obj = {
        value: 42,
        lodashMethod: lodashDebounce(function (this: { value: number }) {
          return this.value
        }, 100),
        nativeMethod: debounce(function (this: { value: number }) {
          return this.value
        }, 100),
      }
      const lodashSpy = jest.fn()
      const nativeSpy = jest.fn()
      obj.lodashMethod = lodashDebounce(function (this: { value: number }) {
        lodashSpy(this.value)
      }, 100)
      obj.nativeMethod = debounce(function (this: { value: number }) {
        nativeSpy(this.value)
      }, 100)
      obj.lodashMethod()
      obj.nativeMethod()
      jest.advanceTimersByTime(100)
      expect(lodashSpy).toHaveBeenCalledWith(42)
      expect(nativeSpy).toHaveBeenCalledWith(42)
    })
  })
  describe('timing precision', () => {
    it('should not invoke before wait time', () => {
      const fn = jest.fn()
      const debounced = debounce(fn, 100)
      debounced()
      jest.advanceTimersByTime(99)
      expect(fn).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })
    it('should reset timer on each call', () => {
      const fn = jest.fn()
      const debounced = debounce(fn, 100)
      debounced()
      jest.advanceTimersByTime(80)
      debounced()
      jest.advanceTimersByTime(80)
      expect(fn).not.toHaveBeenCalled()
      jest.advanceTimersByTime(20)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
