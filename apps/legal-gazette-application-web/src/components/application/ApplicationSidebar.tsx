'use client'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  FormStepper,
  Section,
  Text,
} from '@dmr.is/ui/components/island-is'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { LegalGazetteForm } from '../../lib/forms/types'
import { useTRPC } from '../../lib/trpc/client/trpc'
import * as styles from './application.css'

type Props = {
  form: LegalGazetteForm
}

export const ApplicationSidebar = ({ form }: Props) => {
  const trpc = useTRPC()

  const { getValues } = useFormContext<BaseApplicationWebSchema>()
  const id = getValues('metadata.applicationId')
  const [activeSubSection, setActiveSubSection] = useState<number>(0)
  const [intersectionEntries, setIntersectionEntries] = useState<
    Map<number, number>
  >(new Map())

  // Enhanced interaction tracking
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false)
  const [interactionType, setInteractionType] = useState<
    'focus' | 'hover' | null
  >(null)
  const [interactionTimeout, setInteractionTimeout] =
    useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkScrollability = () => {
      const hasVerticalScroll = document.body.scrollHeight > window.innerHeight
      const hasContentOverflow =
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight

      return hasVerticalScroll || hasContentOverflow
    }

    // Check if we have multiple sections intersecting (ambiguous state)
    const hasMultipleVisibleSections = () => {
      return intersectionEntries.size > 1
    }

    // Focus handler (highest priority)
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      const fieldContainer = target.closest('[data-section-index]')

      if (fieldContainer) {
        const sectionIndex = parseInt(
          fieldContainer.getAttribute('data-section-index') || '0',
        )

        // Focus always wins, regardless of intersection state
        setIsUserInteracting(true)
        setInteractionType('focus')
        setActiveSubSection(sectionIndex)

        // Clear existing timeout
        if (interactionTimeout) {
          clearTimeout(interactionTimeout)
        }

        // Focus gets longer timeout
        const timeout = setTimeout(() => {
          setIsUserInteracting(false)
          setInteractionType(null)
        }, 3000) // 3 seconds for focus

        setInteractionTimeout(timeout)
      }
    }

    // Hover handler (lower priority, only when multiple sections visible)
    const handleHover = (event: Event) => {
      // Only handle hover when we have multiple visible sections AND no active focus
      if (!hasMultipleVisibleSections() || interactionType === 'focus') {
        return
      }

      if (event.type === 'mouseenter') {
        const target = event.target as HTMLElement
        const fieldContainer = target.closest('[data-section-index]')

        if (fieldContainer) {
          const sectionIndex = parseInt(
            fieldContainer.getAttribute('data-section-index') || '0',
          )

          setIsUserInteracting(true)
          setInteractionType('hover')
          setActiveSubSection(sectionIndex)

          // Clear existing timeout
          if (interactionTimeout) {
            clearTimeout(interactionTimeout)
          }
        }
      } else if (event.type === 'mouseleave') {
        // Start timeout when mouse leaves (only for hover interactions)
        if (interactionType === 'hover') {
          const timeout = setTimeout(() => {
            setIsUserInteracting(false)
            setInteractionType(null)
          }, 500) // Shorter timeout for hover

          setInteractionTimeout(timeout)
        }
      }
    }

    // Click handler (medium priority)
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const fieldContainer = target.closest('[data-section-index]')

      if (fieldContainer) {
        const sectionIndex = parseInt(
          fieldContainer.getAttribute('data-section-index') || '0',
        )

        // Click overrides hover but not focus
        if (interactionType !== 'focus') {
          setIsUserInteracting(true)
          setInteractionType('focus') // Treat clicks like focus
          setActiveSubSection(sectionIndex)

          // Clear existing timeout
          if (interactionTimeout) {
            clearTimeout(interactionTimeout)
          }

          const timeout = setTimeout(() => {
            setIsUserInteracting(false)
            setInteractionType(null)
          }, 2000) // 2 seconds for clicks

          setInteractionTimeout(timeout)
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Skip intersection observer updates if user is actively interacting
        if (isUserInteracting) return

        const newEntries = new Map(intersectionEntries)

        entries.forEach((entry) => {
          const sectionIndex = parseInt(
            entry.target.getAttribute('data-section-index') || '0',
          )

          if (entry.isIntersecting) {
            newEntries.set(sectionIndex, entry.intersectionRatio)
          } else {
            newEntries.delete(sectionIndex)
          }
        })

        setIntersectionEntries(newEntries)

        // Handle the case where there's no scroll
        if (!checkScrollability()) {
          setActiveSubSection(0)
          return
        }

        // Normal scroll behavior (only when not interacting)
        if (newEntries.size > 0) {
          const mostVisibleSection = Array.from(newEntries.entries()).reduce(
            (max, [index, ratio]) =>
              ratio > max.ratio ? { index, ratio } : max,
            { index: 0, ratio: 0 },
          )

          setActiveSubSection(mostVisibleSection.index)
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-50px 0px',
      },
    )

    const sections = document.querySelectorAll('[data-section-index]')
    sections.forEach((section) => {
      observer.observe(section)

      // Add hover listeners to each section
      section.addEventListener('mouseenter', handleHover)
      section.addEventListener('mouseleave', handleHover)
    })

    // Add focus and click listeners
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('click', handleClick, true) // Use capture phase

    // Initial check for scroll
    if (!checkScrollability()) {
      setActiveSubSection(0)
    }

    // Resize handler
    const handleResize = () => {
      if (!checkScrollability()) {
        setActiveSubSection(0)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      observer.disconnect()

      // Clean up section event listeners
      sections.forEach((section) => {
        section.removeEventListener('mouseenter', handleHover)
        section.removeEventListener('mouseleave', handleHover)
      })

      // Clean up document event listeners
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('resize', handleResize)

      // Clear timeout
      if (interactionTimeout) {
        clearTimeout(interactionTimeout)
      }
    }
  }, [
    intersectionEntries,
    isUserInteracting,
    interactionType,
    interactionTimeout,
  ])

  const { data: application, isPending } = useQuery(
    trpc.getApplicationById.queryOptions({ id: id }),
  )

  if (isPending) {
    return (
      <SkeletonLoader
        repeat={5}
        height={44}
        space={1}
        borderRadius="standard"
      />
    )
  }

  const currentStep = application?.currentStep ?? 0

  const sections = form.steps.map((step, i) => {
    const isActive = i === currentStep
    const isComplete = i < currentStep

    const hasSubsteps = step.fields.length > 1

    const subSections = hasSubsteps
      ? step.fields.map((subStep, j) => {
          const isSubSectionActive = isActive && j === activeSubSection

          return (
            <Text
              variant="medium"
              fontWeight={isSubSectionActive ? 'semiBold' : 'regular'}
              key={j}
            >
              {subStep.title}
            </Text>
          )
        })
      : []

    return (
      <Section
        key={step.stepTitle}
        section={step.stepTitle}
        isActive={isActive}
        isComplete={isComplete}
        sectionIndex={i}
        subSections={subSections}
      />
    )
  })

  return (
    <Box className={styles.sidebarStyles}>
      <FormStepper sections={sections} />
    </Box>
  )
}
