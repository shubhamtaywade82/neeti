import { create } from 'zustand'
import { useAuthStore } from './authStore'

export interface CitedSutra {
  id: string
  preview: string
  sanskrit?: string
  transliteration?: string
  translation_en?: string
  translation_hi?: string
  chapter?: number
  chapter_title?: string
  themes?: string[]
  virtues?: string[]
  vices?: string[]
  situations?: string[]
  emotions?: string[]
}

export interface AdvisorResult {
  conversation_id: number
  cited_sutras: CitedSutra[]
  reflection_score: number
}

interface AdvisorState {
  streamedText: string
  isStreaming: boolean
  result: AdvisorResult | null
  error: string | null
  activeConvoId: number | undefined
  controller: AbortController | null
  activeQuery: string | null

  setActiveConvoId: (id: number | undefined) => void
  reset: () => void
  cancel: () => void
  ask: (query: string, conversationId?: number, mode?: string, advisor?: string, retrievalScope?: string) => Promise<string>
}

export const useAdvisorStore = create<AdvisorState>((set, get) => ({
  streamedText: '',
  isStreaming: false,
  result: null,
  error: null,
  activeConvoId: undefined,
  controller: null,
  activeQuery: null,

  setActiveConvoId: (id) => set({ activeConvoId: id }),

  reset: () => set({ streamedText: '', result: null, error: null, isStreaming: false, activeQuery: null }),

  cancel: () => {
    const { controller } = get()
    if (controller) {
      controller.abort()
    }
    set({ isStreaming: false, controller: null })
  },

  ask: async (query, conversationId, mode, advisor, retrievalScope) => {
    set({ streamedText: '', result: null, error: null, isStreaming: true, activeQuery: query })

    const token = useAuthStore.getState().token
    const controller = new AbortController()
    set({ controller })

    let accumulated = ''

    try {
      // Connect using VITE_API_URL or default to relative path
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/v1/advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          query,
          ...(conversationId && { conversation_id: conversationId }),
          ...(mode && { mode }),
          ...(advisor && { advisor }),
          ...(retrievalScope && { retrieval_scope: retrievalScope })
        }),
        signal: controller.signal
      })

      if (res.status === 429) {
        const data = await res.json()
        set({ error: data.error, isStreaming: false, controller: null })
        return accumulated
      }

      if (res.status === 401) {
        set({ error: 'Session expired. Please log in again.', isStreaming: false, controller: null })
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return accumulated
      }

      if (!res.body) {
        set({ error: 'No response body', isStreaming: false, controller: null })
        return accumulated
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let lineBuffer = ''

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'token') {
            accumulated += data.content
            set((state) => ({ streamedText: state.streamedText + data.content }))
          } else if (data.type === 'complete') {
            set({
              result: {
                conversation_id: data.conversation_id,
                cited_sutras: data.cited_sutras,
                reflection_score: data.reflection_score
              },
              activeConvoId: data.conversation_id
            })
          } else if (data.type === 'error') {
            set({ error: data.message })
          }
        } catch {
          // Ignore malformed SSE lines
        }
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        lineBuffer += decoder.decode(value, { stream: true })
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() ?? ''

        for (const line of lines) processLine(line)
      }

      if (lineBuffer.trim()) processLine(lineBuffer)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        set({ error: 'Connection error. Please try again.' })
      }
    } finally {
      set({ isStreaming: false, controller: null })
    }

    return accumulated
  }
}))
