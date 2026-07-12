import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FeatureFlags {
  dashboardView: boolean
  packsView: boolean
  graphExplorerView: boolean
  sutraBrowserView: boolean
  memoryInsightsView: boolean
  chatReasoning: boolean
  chatCitationsToggle: boolean
  documentsView: boolean
  collectionsView: boolean
}

interface FeatureFlagsState {
  flags: FeatureFlags
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void
}

const defaultFlags: FeatureFlags = {
  dashboardView: true,
  packsView: true,
  graphExplorerView: true,
  sutraBrowserView: true,
  memoryInsightsView: true,
  chatReasoning: true,
  chatCitationsToggle: true,
  documentsView: true,
  collectionsView: true,
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  persist(
    (set) => ({
      flags: defaultFlags,
      setFlag: (flag, value) =>
        set((state) => ({
          flags: {
            ...state.flags,
            [flag]: value,
          },
        })),
    }),
    {
      name: 'neeti-beta-flags',
    }
  )
)
