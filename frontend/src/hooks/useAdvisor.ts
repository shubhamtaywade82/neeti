import { useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'

interface CitedSutra {
  id:      string
  preview: string
}

interface AdvisorResult {
  conversation_id:  number
  cited_sutras:     CitedSutra[]
  reflection_score: number
}

export function useAdvisor() {
  const [streamedText, setStreamedText] = useState('')
  const [isStreaming, setIsStreaming]   = useState(false)
  const [result, setResult]             = useState<AdvisorResult | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const controllerRef                   = useRef<AbortController | null>(null)
  const token                           = useAuthStore((s) => s.token)

  const ask = useCallback(async (query: string, conversationId?: number): Promise<string> => {
    setStreamedText('')
    setResult(null)
    setError(null)
    setIsStreaming(true)

    controllerRef.current = new AbortController()
    let accumulated = ''

    try {
      const res = await fetch('/api/v1/advice', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept':        'text/event-stream'
        },
        body:   JSON.stringify({ query, ...(conversationId && { conversation_id: conversationId }) }),
        signal: controllerRef.current.signal
      })

      if (res.status === 429) {
        const data = await res.json()
        setError(data.error)
        setIsStreaming(false)
        return accumulated
      }

      if (res.status === 401) {
        setError('Session expired. Please log in again.')
        setIsStreaming(false)
        return accumulated
      }

      if (!res.body) {
        setError('No response body')
        setIsStreaming(false)
        return accumulated
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let lineBuffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        lineBuffer += decoder.decode(value, { stream: true })
        const lines = lineBuffer.split('\n')
        // last element may be incomplete — keep it in buffer
        lineBuffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'token') {
              accumulated += data.content
              setStreamedText((prev) => prev + data.content)
            } else if (data.type === 'complete') {
              setResult({
                conversation_id:  data.conversation_id,
                cited_sutras:     data.cited_sutras,
                reflection_score: data.reflection_score
              })
            } else if (data.type === 'error') {
              setError(data.message)
            }
          } catch {
            // malformed SSE line — ignore
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Connection error. Please try again.')
      }
    } finally {
      setIsStreaming(false)
    }

    return accumulated
  }, [token])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { streamedText, isStreaming, result, error, ask, cancel }
}
