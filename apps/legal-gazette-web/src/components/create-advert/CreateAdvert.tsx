'use client'

import { useRouter } from 'next/navigation'

import { isEmail } from 'class-validator'
import { useCallback, useEffect, useState } from 'react'
import z from 'zod'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Button,
  DatePicker,
  GridRow,
  Inline,
  Input,
  Select,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { GridColumn } from '@island.is/island-ui/core'

import { Route } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { createAdvertDtoSchema } from '../../lib/trpc/server/routers/advertsRouter'
import { Editor } from '../editor/HTMLEditor'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export const CreateAdvert = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [createState, setCreateState] = useState<
    z.infer<typeof createAdvertDtoSchema>
  >({
    typeId: '',
    categoryId: '',
    title: '',
    content: '',
    scheduledAt: [],
    communicationChannels: [],
  })

  const { mutate: createAdvert, isPending: isCreating } = useMutation(
    trpc.createAdvert.mutationOptions({
      onMutate: () => {
        queryClient.invalidateQueries(trpc.getAdvertsInProgress.queryFilter())
        queryClient.invalidateQueries(trpc.getAdvertsCount.queryFilter())
      },
      onSuccess: ({ id }) => {
        router.push(`${Route.RITSTJORN_ID.replace('[id]', id)}`)
      },
      onError: (_err) => {
        toast.error('Ekki tókst að stofna auglýsingu')
      },
    }),
  )

  const { data: typesData, isLoading: isLoadingTypes } = useQuery(
    trpc.getTypes.queryOptions({ excludeUnassignable: true }),
  )

  const typeOptions = typesData?.types.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery(
    trpc.getCategories.queryOptions(
      { type: createState.typeId },
      {
        enabled: createState.typeId !== '',
      },
    ),
  )

  const categoriesOptions = categoriesData?.categories.map((cat) => ({
    label: cat.title,
    value: cat.id,
  }))

  useEffect(() => {
    const cats = categoriesData?.categories || []

    if (cats.length === 1) {
      return setCreateState((prev) => ({
        ...prev,
        categoryId: cats[0].id,
      }))
    }

    setCreateState((prev) => ({
      ...prev,
      categoryId: '',
    }))
  }, [categoriesData])

  const handleDateChange = useCallback((iso: string, index: number) => {
    setCreateState((prev) => {
      const newDates = [...prev.scheduledAt]
      newDates[index] = iso
      return {
        ...prev,
        scheduledAt: newDates,
      }
    })
  }, [])

  const getMinDateForIndex = useCallback(
    (index: number) => {
      if (index === 0) {
        return new Date()
      }
      if (createState.scheduledAt.length >= index) {
        const prevDate = new Date(createState.scheduledAt[index - 1])
        prevDate.setDate(prevDate.getDate() + 1)
        return prevDate
      }
      return new Date()
    },
    [createState.scheduledAt],
  )

  const addCommunicationChannel = useCallback(() => {
    setCreateState((prev) => ({
      ...prev,
      communicationChannels: [
        ...prev.communicationChannels,
        { email: '', name: '', phone: '' },
      ],
    }))
  }, [])

  const removeCommunicationChannel = useCallback((index: number) => {
    setCreateState((prev) => {
      const newChannels = [...prev.communicationChannels]
      newChannels.splice(index, 1)
      return {
        ...prev,
        communicationChannels: newChannels,
      }
    })
  }, [])

  const onCommunicationChannelChange = useCallback(
    (index: number, field: 'email' | 'name' | 'phone', value: string) => {
      setCreateState((prev) => {
        const newChannels = [...prev.communicationChannels]
        newChannels[index] = {
          ...newChannels[index],
          [field]: value,
        }
        return {
          ...prev,
          communicationChannels: newChannels,
        }
      })
    },
    [],
  )

  return (
    <Stack space={3}>
      <GridRow>
        <GridColumn span={['12/12']}>
          <Text variant="h3">Ný auglýsing</Text>
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            required
            isLoading={isLoadingTypes}
            name="typeId"
            label="Tegund auglýsingar"
            size="sm"
            backgroundColor="blue"
            onChange={(opt) => {
              setCreateState((prev) => ({
                ...prev,
                typeId: opt?.value ?? '',
                categoryId: '',
              }))
            }}
            options={typeOptions}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            required
            isLoading={isLoadingCategories}
            name="categoryId"
            label="Flokkur auglýsingar"
            size="sm"
            backgroundColor="blue"
            noOptionsMessage="Veldu tegund fyrst"
            options={categoriesOptions}
            onChange={(opt) =>
              setCreateState((prev) => ({
                ...prev,
                categoryId: opt?.value ?? '',
              }))
            }
            value={categoriesOptions?.find(
              (opt) => opt.value === createState.categoryId,
            )}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12']}>
          <Input
            required
            name="title"
            backgroundColor="blue"
            size="sm"
            label="Heiti auglýsingar"
            onChange={(e) =>
              setCreateState((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12']}>
          <Editor
            onChange={(val) =>
              setCreateState((prev) => ({ ...prev, content: val }))
            }
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        {Array.from({ length: 3 }).map((_, index) => (
          <GridColumn
            paddingBottom={index < 2 ? 3 : 0}
            key={index}
            span={['12/12', '6/12']}
          >
            <DatePicker
              required={index === 0}
              locale="is"
              minDate={getMinDateForIndex(index)}
              disabled={createState.scheduledAt.length < index}
              label={`Birtingardagur ${index + 1}`}
              placeholderText=""
              size="sm"
              backgroundColor="blue"
              handleChange={(date) => {
                handleDateChange(date.toISOString(), index)
              }}
            />
          </GridColumn>
        ))}
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12']}>
          <DataTable
            noDataMessage="Samskiptaleiðir birtast hér"
            columns={[
              {
                field: 'email',
                children: 'Netfang',
              },
              {
                field: 'name',
                children: 'Nafn',
              },
              {
                field: 'phone',
                children: 'Símanúmer',
              },
              {
                field: 'options',
                children: (
                  <Button
                    disabled={
                      createState.communicationChannels[
                        createState.communicationChannels.length - 1
                      ]?.email.trim() === ''
                    }
                    circle
                    icon="add"
                    variant="ghost"
                    size="small"
                    onClick={addCommunicationChannel}
                  />
                ),
                size: 'tiny' as const,
              },
            ]}
            rows={createState.communicationChannels.map((ch, index) => ({
              email: (
                <Input
                  backgroundColor="blue"
                  errorMessage={isEmail(ch.email) ? '' : 'Netfang er ekki gilt'}
                  required
                  size="sm"
                  label="Netfang"
                  name={`channelEmail${index}`}
                  value={ch.email}
                  onChange={(e) =>
                    onCommunicationChannelChange(index, 'email', e.target.value)
                  }
                />
              ),
              name: (
                <Input
                  backgroundColor="blue"
                  size="sm"
                  label="Nafn"
                  name={`channelName${index}`}
                  value={ch.name}
                  onChange={(e) =>
                    onCommunicationChannelChange(index, 'name', e.target.value)
                  }
                />
              ),
              phone: (
                <Input
                  backgroundColor="blue"
                  size="sm"
                  label="Sími"
                  name={`channelPhone${index}`}
                  value={ch.phone}
                  onChange={(e) =>
                    onCommunicationChannelChange(index, 'phone', e.target.value)
                  }
                />
              ),
              options: (
                <Button
                  circle
                  variant="ghost"
                  colorScheme="destructive"
                  size="small"
                  icon="trash"
                  onClick={() => removeCommunicationChannel(index)}
                />
              ),
            }))}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12']}>
          <Inline justifyContent="flexEnd">
            <Button
              loading={isCreating}
              disabled={isCreating}
              variant="primary"
              size="small"
              onClick={() => {
                return createAdvert({
                  ...createState,
                  communicationChannels:
                    createState.communicationChannels.filter(
                      (ch) => ch.email.trim() !== '',
                    ),
                })
              }}
            >
              Stofna auglýsingu
            </Button>
          </Inline>
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
