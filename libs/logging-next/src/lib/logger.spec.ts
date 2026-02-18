import { createLogger, getLogger } from './logger'
describe('NextLogger', () => {
  let consoleDebugSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let originalNodeEnv: string | undefined
  let originalLogLevel: string | undefined
  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    originalNodeEnv = process.env['NODE_ENV']
    originalLogLevel = process.env['LOG_LEVEL']
  })
  afterEach(() => {
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    process.env['NODE_ENV'] = originalNodeEnv
    process.env['LOG_LEVEL'] = originalLogLevel
  })
  describe('getLogger', () => {
    it('should create a logger with a category', () => {
      const logger = getLogger('test-category')
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
    })
    it('should log info messages with category', () => {
      process.env['LOG_LEVEL'] = 'info'
      const logger = getLogger('test-category')
      logger.info('test message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('[test-category]')
      expect(loggedMessage).toContain('INFO')
      expect(loggedMessage).toContain('test message')
    })
  })
  describe('log levels', () => {
    it('should respect log level filtering', () => {
      process.env['LOG_LEVEL'] = 'warn'
      const logger = createLogger('test')
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
    it('should default to debug level in development', () => {
      process.env['NODE_ENV'] = 'development'
      delete process.env['LOG_LEVEL']
      const logger = createLogger('test')
      logger.debug('debug message')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
    })
    it('should default to info level in production', () => {
      process.env['NODE_ENV'] = 'production'
      delete process.env['LOG_LEVEL']
      const logger = createLogger('test')
      logger.debug('debug message')
      logger.info('info message')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('message formatting', () => {
    it('should format messages with timestamp in development', () => {
      process.env['NODE_ENV'] = 'development'
      process.env['LOG_LEVEL'] = 'info'
      const logger = getLogger('test')
      logger.info('test message')
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(loggedMessage).toContain('[test]')
      expect(loggedMessage).toContain('INFO')
      expect(loggedMessage).toContain('test message')
    })
    it('should output JSON in production', () => {
      process.env['NODE_ENV'] = 'production'
      process.env['LOG_LEVEL'] = 'info'
      const logger = getLogger('test')
      logger.info('test message', { key: 'value' })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      const parsed = JSON.parse(loggedMessage)
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('test message')
      expect(parsed.category).toBe('test')
      expect(parsed.context).toBe('test')
      expect(parsed.key).toBe('value')
      expect(parsed.timestamp).toBeDefined()
    })
    it('should include metadata in log output', () => {
      process.env['NODE_ENV'] = 'development'
      process.env['LOG_LEVEL'] = 'info'
      const logger = getLogger('test')
      logger.info('test message', { userId: '123', action: 'login' })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('{"userId":"123","action":"login"}')
    })
  })
  describe('child logger', () => {
    it('should create a child logger with new category', () => {
      process.env['LOG_LEVEL'] = 'info'
      const parent = getLogger('parent')
      const child = parent.child({ category: 'child', context: 'child' })
      child.info('child message')
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('[child]')
      expect(loggedMessage).toContain('child message')
    })
    it('should inherit log level from parent', () => {
      process.env['LOG_LEVEL'] = 'warn'
      const parent = createLogger('parent')
      const child = parent.child({ category: 'child', context: 'child' })
      child.info('should not log')
      child.warn('should log')
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('all log levels', () => {
    it('should call debug with correct level', () => {
      process.env['LOG_LEVEL'] = 'debug'
      const logger = getLogger('test')
      logger.debug('debug message')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      const message = consoleDebugSpy.mock.calls[0][0]
      expect(message).toContain('DEBUG')
    })
    it('should call info with correct level', () => {
      process.env['LOG_LEVEL'] = 'info'
      const logger = getLogger('test')
      logger.info('info message')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      const message = consoleInfoSpy.mock.calls[0][0]
      expect(message).toContain('INFO')
    })
    it('should call warn with correct level', () => {
      process.env['LOG_LEVEL'] = 'warn'
      const logger = getLogger('test')
      logger.warn('warn message')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const message = consoleWarnSpy.mock.calls[0][0]
      expect(message).toContain('WARN')
    })
    it('should call error with correct level', () => {
      process.env['LOG_LEVEL'] = 'error'
      const logger = getLogger('test')
      logger.error('error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const message = consoleErrorSpy.mock.calls[0][0]
      expect(message).toContain('ERROR')
    })
  })
})
