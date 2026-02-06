import { notFound, redirect } from 'next/navigation'

import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { AdvertVersionEnum } from '../../gen/fetch'
import {
  handlePublicationRedirects,
  isUUID,
  normalizeVersion,
} from './url-helpers'

// Mock Next.js navigation functions
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock tRPC client
jest.mock('@dmr.is/trpc/client/server', () => ({
  fetchQueryWithHandler: jest.fn(),
}))

jest.mock('../trpc/client/server', () => ({
  trpc: {
    getPublicationById: {
      queryOptions: jest.fn(),
    },
  },
}))

describe('url-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isUUID', () => {
    it('should return true for valid UUID v4', () => {
      const validUUIDs = [
        '123e4567-e89b-42d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '550e8400-e29b-41d4-a716-446655440000',
      ]

      validUUIDs.forEach((uuid) => {
        expect(isUUID(uuid)).toBe(true)
      })
    })

    it('should return false for invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-426614174000', // wrong version (1 instead of 4)
        '123e4567-e89b-42d3-f456-426614174000', // wrong variant (f instead of 8-b)
        '123e4567e89b42d3a456426614174000', // no dashes
        '123e4567-e89b-42d3-a456', // incomplete
        '',
        'A2025-0001',
      ]

      invalidUUIDs.forEach((uuid) => {
        expect(isUUID(uuid)).toBe(false)
      })
    })

    it('should be case-insensitive', () => {
      expect(isUUID('123E4567-E89B-42D3-A456-426614174000')).toBe(true)
      expect(isUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
    })
  })

  describe('normalizeVersion', () => {
    it('should convert lowercase to uppercase', () => {
      expect(normalizeVersion('a')).toBe('A')
      expect(normalizeVersion('b')).toBe('B')
      expect(normalizeVersion('c')).toBe('C')
    })

    it('should keep uppercase as is', () => {
      expect(normalizeVersion('A')).toBe('A')
      expect(normalizeVersion('B')).toBe('B')
      expect(normalizeVersion('C')).toBe('C')
    })

    it('should handle mixed case', () => {
      expect(normalizeVersion('Ab')).toBe('AB')
      expect(normalizeVersion('bC')).toBe('BC')
    })
  })

  describe('handlePublicationRedirects', () => {
    const mockPublicationNumber = 'A2025-0001'
    const mockUUID = '123e4567-e89b-42d3-a456-426614174000'

    describe('valid publication number with valid version', () => {
      it('should return normalized params when version is already uppercase', async () => {
        const result = await handlePublicationRedirects(
          mockPublicationNumber,
          'A',
        )

        expect(result).toEqual({
          publicationNumber: mockPublicationNumber,
          version: AdvertVersionEnum.A,
        })
        expect(redirect).not.toHaveBeenCalled()
      })

      it('should redirect when version is lowercase', async () => {
        const mockRedirect = redirect as unknown as jest.Mock
        mockRedirect.mockImplementation(() => {
          throw new Error('NEXT_REDIRECT')
        })

        await expect(
          handlePublicationRedirects(mockPublicationNumber, 'a'),
        ).rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(
          `/auglysingar/${mockPublicationNumber}/A`,
        )
      })
    })

    describe('UUID redirects', () => {
      it('should redirect from UUID to publication number with normalized version', async () => {
        const mockFetch = fetchQueryWithHandler as unknown as jest.Mock
        mockFetch.mockResolvedValue({
          advert: {
            publicationNumber: mockPublicationNumber,
          },
        })
        const mockRedirect = redirect as unknown as jest.Mock
        mockRedirect.mockImplementation(() => {
          throw new Error('NEXT_REDIRECT')
        })

        await expect(handlePublicationRedirects(mockUUID, 'a')).rejects.toThrow(
          'NEXT_REDIRECT',
        )

        expect(redirect).toHaveBeenCalledWith(
          `/auglysingar/${mockPublicationNumber}/A`,
        )
      })

      it('should call notFound when UUID publication has no publication number (unpublished)', async () => {
        const mockFetch = fetchQueryWithHandler as unknown as jest.Mock
        mockFetch.mockResolvedValue({
          advert: {
            publicationNumber: undefined,
          },
        })
        const mockNotFound = notFound as unknown as jest.Mock
        mockNotFound.mockImplementation(() => {
          throw new Error('NEXT_NOT_FOUND')
        })

        await expect(handlePublicationRedirects(mockUUID, 'A')).rejects.toThrow(
          'NEXT_NOT_FOUND',
        )

        expect(notFound).toHaveBeenCalled()
      })

      it('should call notFound when UUID publication is not found', async () => {
        const mockFetch = fetchQueryWithHandler as unknown as jest.Mock
        mockFetch.mockRejectedValue(new Error('Not found'))
        const mockNotFound = notFound as unknown as jest.Mock
        mockNotFound.mockImplementation(() => {
          throw new Error('NEXT_NOT_FOUND')
        })

        await expect(handlePublicationRedirects(mockUUID, 'A')).rejects.toThrow(
          'NEXT_NOT_FOUND',
        )

        expect(notFound).toHaveBeenCalled()
      })
    })

    describe('invalid version', () => {
      it('should call notFound for invalid version enum', async () => {
        const mockNotFound = notFound as unknown as jest.Mock
        mockNotFound.mockImplementation(() => {
          throw new Error('NEXT_NOT_FOUND')
        })

        await expect(
          handlePublicationRedirects(mockPublicationNumber, 'D'),
        ).rejects.toThrow('NEXT_NOT_FOUND')

        expect(notFound).toHaveBeenCalled()
      })

      it('should call notFound for invalid version string', async () => {
        const mockNotFound = notFound as unknown as jest.Mock
        mockNotFound.mockImplementation(() => {
          throw new Error('NEXT_NOT_FOUND')
        })

        await expect(
          handlePublicationRedirects(mockPublicationNumber, 'invalid'),
        ).rejects.toThrow('NEXT_NOT_FOUND')

        expect(notFound).toHaveBeenCalled()
      })

      it('should call notFound for empty version', async () => {
        const mockNotFound = notFound as unknown as jest.Mock
        mockNotFound.mockImplementation(() => {
          throw new Error('NEXT_NOT_FOUND')
        })

        await expect(
          handlePublicationRedirects(mockPublicationNumber, ''),
        ).rejects.toThrow('NEXT_NOT_FOUND')

        expect(notFound).toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle publication number that looks like UUID but is not', async () => {
        const almostUUID = 'not-a-uuid-but-has-dashes'

        const result = await handlePublicationRedirects(almostUUID, 'A')

        expect(result).toEqual({
          publicationNumber: almostUUID,
          version: AdvertVersionEnum.A,
        })
        expect(fetchQueryWithHandler).not.toHaveBeenCalled()
      })

      it('should redirect when both UUID conversion and version normalization needed', async () => {
        const mockFetch = fetchQueryWithHandler as unknown as jest.Mock
        mockFetch.mockResolvedValue({
          advert: {
            publicationNumber: mockPublicationNumber,
          },
        })
        const mockRedirect = redirect as unknown as jest.Mock
        mockRedirect.mockImplementation(() => {
          throw new Error('NEXT_REDIRECT')
        })

        await expect(handlePublicationRedirects(mockUUID, 'b')).rejects.toThrow(
          'NEXT_REDIRECT',
        )

        expect(redirect).toHaveBeenCalledWith(
          `/auglysingar/${mockPublicationNumber}/B`,
        )
      })
    })
  })
})
