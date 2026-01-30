import {
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { fetchWithTimeout } from '@dmr.is/utils'

import { NationalRegistryService } from './national-registry.service'

jest.mock('@dmr.is/utils', () => ({
  fetchWithTimeout: jest.fn(),
}))

const mockFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<
  typeof fetchWithTimeout
>

describe('NationalRegistryService', () => {
  let service: NationalRegistryService
  let mockLogger: Record<string, jest.Mock>

  const mockEnv = {
    NATIONAL_REGISTRY_API_LOGIN_PATH: 'https://api.example.com/login',
    NATIONAL_REGISTRY_API_LOOKUP_PATH: 'https://api.example.com/lookup',
    NATIONAL_REGISTRY_CLIENT_USER: 'test-user',
    NATIONAL_REGISTRY_CLIENT_PASSWORD: 'test-password',
  }

  beforeEach(async () => {
    // Set environment variables
    Object.assign(process.env, mockEnv)

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NationalRegistryService,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile()

    service = module.get<NationalRegistryService>(NationalRegistryService)
    mockFetchWithTimeout.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should throw InternalServerErrorException if NATIONAL_REGISTRY_CLIENT_USER is not set', async () => {
      const originalUser = process.env.NATIONAL_REGISTRY_CLIENT_USER
      delete process.env.NATIONAL_REGISTRY_CLIENT_USER

      await expect(async () => {
        await Test.createTestingModule({
          providers: [
            NationalRegistryService,
            { provide: LOGGER_PROVIDER, useValue: mockLogger },
          ],
        }).compile()
      }).rejects.toThrow(InternalServerErrorException)

      process.env.NATIONAL_REGISTRY_CLIENT_USER = originalUser
    })

    it('should throw InternalServerErrorException if NATIONAL_REGISTRY_CLIENT_PASSWORD is not set', async () => {
      const originalPassword = process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD
      delete process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD

      await expect(async () => {
        await Test.createTestingModule({
          providers: [
            NationalRegistryService,
            { provide: LOGGER_PROVIDER, useValue: mockLogger },
          ],
        }).compile()
      }).rejects.toThrow(InternalServerErrorException)

      process.env.NATIONAL_REGISTRY_CLIENT_PASSWORD = originalPassword
    })

    it('should log error if NATIONAL_REGISTRY_API_LOGIN_PATH is not set', async () => {
      const originalPath = process.env.NATIONAL_REGISTRY_API_LOGIN_PATH
      delete process.env.NATIONAL_REGISTRY_API_LOGIN_PATH

      await Test.createTestingModule({
        providers: [
          NationalRegistryService,
          { provide: LOGGER_PROVIDER, useValue: mockLogger },
        ],
      }).compile()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'National registry login path not set in env NATIONAL_REGISTRY_API_LOGIN_PATH',
        { context: 'NationalRegistryClientService' },
      )

      process.env.NATIONAL_REGISTRY_API_LOGIN_PATH = originalPath
    })

    it('should log error if NATIONAL_REGISTRY_API_LOOKUP_PATH is not set', async () => {
      const originalPath = process.env.NATIONAL_REGISTRY_API_LOOKUP_PATH
      delete process.env.NATIONAL_REGISTRY_API_LOOKUP_PATH

      await Test.createTestingModule({
        providers: [
          NationalRegistryService,
          { provide: LOGGER_PROVIDER, useValue: mockLogger },
        ],
      }).compile()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'National registry lookup path not set in env NATIONAL_REGISTRY_API_LOOKUP_PATH',
        { context: 'NationalRegistryClientService' },
      )

      process.env.NATIONAL_REGISTRY_API_LOOKUP_PATH = originalPath
    })
  })

  describe('authenticate', () => {
    it('should authenticate successfully and cache credentials', async () => {
      mockFetchWithTimeout
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              audkenni: 'auth-123',
              accessToken: 'token-456',
            }),
          ),
          headers: { get: () => 'application/json' },
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              stada: '1',
              kennitala: '1234567890',
              nafn: 'Test Entity',
              loghHusk: 'Test Legal Address',
              heimili: 'Test Address',
              postaritun: '101 Reykjavík',
              sveitarfelag: 'Reykjavík',
              svfNr: '0000',
              kynkodi: 1,
            }),
          ),
          headers: { get: () => 'application/json' },
        } as unknown as Response)

      await service.getEntityByNationalId('1234567890')

      // Should authenticate on first call
      expect(mockFetchWithTimeout).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Authenticating with national registry',
        { context: 'NationalRegistryClientService' },
      )

      // Mock second entity lookup
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            stada: '1',
            kennitala: '0987654321',
            nafn: 'Another Entity',
            loghHusk: 'Another Legal Address',
            heimili: 'Another Address',
            postaritun: '200 Kópavogur',
            sveitarfelag: 'Kópavogur',
            svfNr: '1000',
            kynkodi: 2,
          }),
        ),
        headers: { get: () => 'application/json' },
      } as unknown as Response)

      // Second call should use cached credentials
      await service.getEntityByNationalId('0987654321')
      expect(mockFetchWithTimeout).toHaveBeenCalledTimes(3) // Only 1 more call (no re-auth)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Already authenticated with national registry',
        { context: 'NationalRegistryClientService' },
      )
    })

    it('should throw BadGatewayException on authentication failure', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            type: 'auth-error',
            title: 'Authentication failed',
            status: 401,
            detail: 'Invalid credentials',
          }),
        ),
        headers: { get: () => 'application/json' },
      } as unknown as Response)

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'National registry authentication error',
        expect.objectContaining({ context: 'NationalRegistryClientService' }),
      )
    })

    it('should throw BadGatewayException on authentication JSON parse failure', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Not JSON response'),
        headers: { get: () => 'text/html' },
      } as unknown as Response)

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse authentication error response as JSON',
        expect.objectContaining({ context: 'NationalRegistryClientService' }),
      )
    })

    it('should throw BadGatewayException if authentication response missing required fields', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ audkenni: 'auth-123' })), // Missing accessToken
        headers: { get: () => 'application/json' },
      } as unknown as Response)

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Authentication response missing required fields',
        expect.objectContaining({ context: 'NationalRegistryClientService' }),
      )
    })
  })

  describe('getEntityByNationalId', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ audkenni: 'auth-123', accessToken: 'token-456' }),
          ),
        headers: { get: () => 'application/json' },
      } as unknown as Response)
    })

    it('should fetch entity successfully', async () => {
      const mockEntity = {
        stada: '1',
        kennitala: '1234567890',
        nafn: 'Test Entity',
        loghHusk: 'Test Legal Address',
        heimili: 'Test Address',
        postaritun: '101 Reykjavík',
        sveitarfelag: 'Reykjavík',
        svfNr: '0000',
        kynkodi: 1,
      }

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockEntity)),
        headers: { get: () => 'application/json' },
      } as unknown as Response)

      const result = await service.getEntityByNationalId('1234567890')

      expect(result).toEqual({ entity: mockEntity })
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully fetched entity from national registry',
        { context: 'NationalRegistryClientService' },
      )
    })

    it('should throw BadGatewayException on entity lookup failure', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            type: 'not-found',
            title: 'Entity not found',
            status: 404,
            detail: 'No entity with that kennitala',
          }),
        ),
        headers: { get: () => 'application/json' },
      } as unknown as Response)

      await expect(service.getEntityByNationalId('9999999999')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'National registry fetch entity error',
        expect.objectContaining({ context: 'NationalRegistryClientService' }),
      )
    })

    it('should reset tokens and throw BadGatewayException on 401 error', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Invalid token'),
        headers: { get: () => 'text/plain' },
      } as unknown as Response)

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Received 401, resetting authentication tokens',
        { context: 'NationalRegistryClientService' },
      )
    })

    it('should throw BadGatewayException on entity lookup JSON parse failure', async () => {
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('Not valid JSON'),
        headers: { get: () => 'text/html' },
      } as unknown as Response)

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse entity lookup response as JSON',
        expect.objectContaining({ context: 'NationalRegistryClientService' }),
      )
    })

    it('should log debug information for responses', async () => {
      const mockEntity = {
        stada: '1',
        kennitala: '1234567890',
        nafn: 'Test Entity',
        loghHusk: 'Test Legal Address',
        heimili: 'Test Address',
        postaritun: '101 Reykjavík',
        sveitarfelag: 'Reykjavík',
        svfNr: '0000',
        kynkodi: 1,
      }

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockEntity)),
        headers: { get: () => 'application/json' },
      } as unknown as Response)

      await service.getEntityByNationalId('1234567890')

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'National registry entity lookup response',
        expect.objectContaining({
          context: 'NationalRegistryClientService',
          statusCode: 200,
          contentType: 'application/json',
        }),
      )
    })

    it('should handle network errors gracefully', async () => {
      mockFetchWithTimeout.mockRejectedValueOnce(
        new Error('Network connection failed'),
      )

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        'Network connection failed',
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected error during national registry entity lookup',
        expect.objectContaining({
          context: 'NationalRegistryClientService',
          error: 'Network connection failed',
        }),
      )
    })
  })

  describe('parseJsonSafely', () => {
    it('should parse valid JSON successfully', async () => {
      const mockEntity = {
        stada: '1',
        kennitala: '1234567890',
        nafn: 'Test Entity',
        loghHusk: 'Test Legal Address',
        heimili: 'Test Address',
        postaritun: '101 Reykjavík',
        sveitarfelag: 'Reykjavík',
        svfNr: '0000',
        kynkodi: 1,
      }

      mockFetchWithTimeout
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              audkenni: 'auth-123',
              accessToken: 'token-456',
            }),
          ),
          headers: { get: () => 'application/json' },
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(JSON.stringify(mockEntity)),
          headers: { get: () => 'application/json' },
        } as unknown as Response)

      const result = await service.getEntityByNationalId('1234567890')
      expect(result.entity).toEqual(mockEntity)
    })

    it('should throw BadGatewayException and log details on invalid JSON', async () => {
      mockFetchWithTimeout
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              audkenni: 'auth-123',
              accessToken: 'token-456',
            }),
          ),
          headers: { get: () => 'application/json' },
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue('{ invalid json'),
          headers: { get: () => 'application/json' },
        } as unknown as Response)

      await expect(service.getEntityByNationalId('1234567890')).rejects.toThrow(
        BadGatewayException,
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse entity lookup response as JSON',
        expect.objectContaining({
          context: 'NationalRegistryClientService',
          parseError: expect.any(String),
          responseText: expect.any(String),
        }),
      )
    })
  })
})
