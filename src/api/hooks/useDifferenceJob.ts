import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api/client'
import type { components } from '@/api/schema'
import { parseDifferenceJobResult } from '@/api/differenceJobResult'

type DifferenceRequest = components['schemas']['DifferenceRequest']

export function useDifferenceJob() {
  const queryClient = useQueryClient()
  const [monitoring, setMonitoring] = useState(true)

  const submission = useMutation({
    mutationFn: async (payload: DifferenceRequest) => {
      const { data, error, response } = await api.POST('/api/jobs', {
        body: {
          job_type: 'difference_image',
          payload,
        },
      })

      if (!response.ok || error || !data) {
        throw new Error(`Could not submit difference job (${response.status})`)
      }

      return data
    },
    onMutate: () => {
      setMonitoring(true)
    },
  })

  const jobId = submission.data?.id ?? null
  const jobQuery = useQuery({
    queryKey: ['difference-job', jobId],
    enabled: Boolean(jobId) && monitoring,
    queryFn: async ({ signal }) => {
      if (!jobId) throw new Error('A job ID is required to check job status.')

      const { data, error, response } = await api.GET('/api/jobs/{id}', {
        params: { path: { id: jobId } },
        signal,
      })

      if (!response.ok || error || !data) {
        throw new Error(`Could not retrieve difference job status (${response.status})`)
      }

      return data
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'queued' || status === 'running' ? 1200 : false
    },
    refetchIntervalInBackground: false,
  })

  const status = jobQuery.data ?? submission.data
  const result = status?.status === 'completed'
    ? parseDifferenceJobResult(status.result)
    : null
  const invalidCompletedResult =
    status?.status === 'completed' && result === null

  async function stopMonitoring() {
    if (jobId) {
      await queryClient.cancelQueries({ queryKey: ['difference-job', jobId] })
    }
    setMonitoring(false)
  }

  function resumeMonitoring() {
    setMonitoring(true)
  }

  function reset() {
    if (jobId) {
      void queryClient.cancelQueries({ queryKey: ['difference-job', jobId] })
      queryClient.removeQueries({ queryKey: ['difference-job', jobId] })
    }
    submission.reset()
    setMonitoring(true)
  }

  return {
    submit: submission,
    status,
    result,
    invalidCompletedResult,
    queryError: jobQuery.error,
    isChecking: jobQuery.isFetching,
    isMonitoring: monitoring,
    stopMonitoring,
    resumeMonitoring,
    reset,
  }
}
