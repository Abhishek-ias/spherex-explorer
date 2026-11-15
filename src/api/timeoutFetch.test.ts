import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTimeoutFetch } from './timeoutFetch'

function createSignalAwareFetch() {
  return vi.fn<typeof fetch>((_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal
    if (!signal) {
      reject(new Error('Expected the timeout fetch to provide an AbortSignal.'))
      return
    }

    if (signal.aborted) {
      reject(signal.reason)
      return
    }

    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }))
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createTimeoutFetch', () => {
  it('passes through the response and clears its timeout', async () => {
    vi.useFakeTimers()
    const response = new Response('ok', { status: 200 })
    const baseFetch = vi.fn<typeof fetch>().mockResolvedValue(response)
    const timedFetch = createTimeoutFetch(baseFetch, 5000)

    await expect(timedFetch('https://api.example.test/health')).resolves.toBe(response)
    expect(baseFetch).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('aborts a request when the configured timeout expires', async () => {
    vi.useFakeTimers()
    const baseFetch = createSignalAwareFetch()
    const timedFetch = createTimeoutFetch(baseFetch, 2500)
    const request = timedFetch('https://api.example.test/search').then(
      (response) => ({ kind: 'response' as const, response }),
      (error: unknown) => ({ kind: 'error' as const, error }),
    )

    await vi.advanceTimersByTimeAsync(2500)

    const outcome = await request
    expect(outcome).toMatchObject({
      kind: 'error',
      error: {
        name: 'TimeoutError',
        message: 'SPHEREx API request timed out after 2500 ms.',
      },
    })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('propagates caller cancellation without replacing its reason', async () => {
    vi.useFakeTimers()
    const baseFetch = createSignalAwareFetch()
    const timedFetch = createTimeoutFetch(baseFetch, 10_000)
    const caller = new AbortController()
    const reason = new DOMException('Query was replaced.', 'AbortError')
    const request = timedFetch('https://api.example.test/search', {
      signal: caller.signal,
    }).then(
      (response) => ({ kind: 'response' as const, response }),
      (error: unknown) => ({ kind: 'error' as const, error }),
    )

    caller.abort(reason)

    const outcome = await request
    expect(outcome).toEqual({ kind: 'error', error: reason })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects a non-positive or non-finite timeout', () => {
    expect(() => createTimeoutFetch(fetch, 0)).toThrow(RangeError)
    expect(() => createTimeoutFetch(fetch, Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})
