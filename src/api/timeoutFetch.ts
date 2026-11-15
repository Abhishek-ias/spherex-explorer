export const API_REQUEST_TIMEOUT_MS = 120_000

export function createTimeoutFetch(
  baseFetch: typeof fetch,
  timeoutMs = API_REQUEST_TIMEOUT_MS,
): typeof fetch {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('API request timeout must be a positive finite number.')
  }

  return async (input, init = {}) => {
    const controller = new AbortController()
    const externalSignal = init.signal

    const abortFromCaller = () => {
      controller.abort(externalSignal?.reason)
    }

    if (externalSignal?.aborted) {
      abortFromCaller()
    } else {
      externalSignal?.addEventListener('abort', abortFromCaller, { once: true })
    }

    const timeout = window.setTimeout(() => {
      controller.abort(new DOMException(
        `SPHEREx API request timed out after ${timeoutMs} ms.`,
        'TimeoutError',
      ))
    }, timeoutMs)

    try {
      return await baseFetch(input, {
        ...init,
        signal: controller.signal,
      })
    } finally {
      window.clearTimeout(timeout)
      externalSignal?.removeEventListener('abort', abortFromCaller)
    }
  }
}
