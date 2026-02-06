import { notFound, redirect } from 'next/navigation'

import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { AdvertVersionEnum } from '../../gen/fetch'
import { trpc } from '../trpc/client/server'

/**
 * Checks if a string is a valid UUID v4
 */
export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Normalizes version string to uppercase (A, B, C)
 */
export function normalizeVersion(version: string): string {
  return version.toUpperCase()
}

/**
 * Handles publication URL redirects for legacy UUIDs and lowercase versions.
 *
 * Returns normalized params if no redirect is needed, otherwise redirects and doesn't return.
 *
 * @param publicationNumber - Can be UUID or publication number
 * @param version - Version string (case-insensitive)
 * @returns Normalized publicationNumber and version, or notFound if invalid
 */
export async function handlePublicationRedirects(
  publicationNumber: string,
  version: string,
): Promise<{ publicationNumber: string; version: AdvertVersionEnum }> {
  // Normalize version to uppercase
  const normalizedVersion = normalizeVersion(version) as AdvertVersionEnum

  // Validate version is valid enum value
  if (!Object.values(AdvertVersionEnum).includes(normalizedVersion)) {
    notFound()
  }

  let finalPublicationNumber = publicationNumber

  // If publicationNumber is a UUID, look up and get the publication number
  if (isUUID(publicationNumber)) {
    try {
      const publication = await fetchQueryWithHandler(
        trpc.getPublicationById.queryOptions({
          publicationId: publicationNumber,
        }),
      )

      // Publication number is undefined if not published yet
      if (!publication.advert.publicationNumber) {
        notFound()
      }

      finalPublicationNumber = publication.advert.publicationNumber
    } catch (error) {
      // UUID format but publication not found
      notFound()
    }
  }

  // Redirect if we need to normalize version or publication number
  if (
    version !== normalizedVersion ||
    publicationNumber !== finalPublicationNumber
  ) {
    redirect(`/auglysingar/${finalPublicationNumber}/${normalizedVersion}`)
  }

  return {
    publicationNumber: finalPublicationNumber,
    version: normalizedVersion,
  }
}
