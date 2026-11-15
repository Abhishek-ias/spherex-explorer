import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api/client'
import type { components } from '@/api/schema'
import { parseIsolationJobResult } from '@/api/isolationJobResult'

type IsolateRequest = components['schemas']['IsolateRequest']

export function useObjectIsolationJob() {
  const queryClient = useQueryClient()
  const [monitoring, setMonitoring] = useState(true)

  const submission = useMutation({
    mutationFn: async (payload: IsolateRequest) => {
      const { data, error, response } = await api.POST('/api/jobs', {
        body: { job_type: 'object_isolate', payload },
      })
      if (!response.ok || error || !data) {
        throw new Error(`Could not submit isolation job (${response.status})`)
      }
      return data
    },
    onMutate: () => setMonitoring(true),
  })

  const jobId = submission.data?.id ?? null
  const jobQuery = useQuery({
    queryKey: ['isolation-job', jobId],
    enabled: Boolean(jobId) && monitoring,
    queryFn: async ({ signal }) => {
      if (!jobId) throw new Error('A job ID is required to check isolation status.')
      const { data, error, response } = await api.GET('/api/jobs/{id}', {
        params: { path: { id: jobId } },
        signal,
      })
      if (!response.ok || error || !data) {
        throw new Error(`Could not retrieve isolation job status (${response.status})`)
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
    ? parseIsolationJobResult(status.result)
    : null
  const invalidCompletedResult = status?.status === 'completed' && result === null

  async function stopMonitoring() {
    if (jobId) {
      await queryClient.cancelQueries({ queryKey: ['isolation-job', jobId] })
    }
    setMonitoring(false)
  }

  function resumeMonitoring() {
    setMonitoring(true)
  }

  function reset() {
    if (jobId) {
      void queryClient.cancelQueries({ queryKey: ['isolation-job', jobId] })
      queryClient.removeQueries({ queryKey: ['isolation-job', jobId] })
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
    isMonitoring: monitoring,
    stopMonitoring,
    resumeMonitoring,
    reset,
  }
}
