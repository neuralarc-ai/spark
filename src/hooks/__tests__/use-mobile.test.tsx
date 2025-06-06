import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

/**
 * Helper to mock matchMedia and capture the change listener
 */
function setupMatchMedia() {
  let listener: ((e: MediaQueryListEvent) => void) | null = null
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      return {
        media: query,
        matches: window.innerWidth < 768,
        addEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => {
          listener = cb
        },
        removeEventListener: vi.fn(),
        dispatchEvent: (e: MediaQueryListEvent) => {
          if (listener) listener(e)
          return true
        },
      }
    }),
  })
  return () => {
    if (listener) {
      listener(new Event('change') as MediaQueryListEvent)
    }
  }
}

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('detects initial mobile width', async () => {
    window.innerWidth = 500
    const trigger = setupMatchMedia()
    const { result } = renderHook(() => useIsMobile())
    // trigger initial effect
    act(() => {
      trigger()
    })
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('updates when viewport changes', async () => {
    window.innerWidth = 900
    const trigger = setupMatchMedia()
    const { result } = renderHook(() => useIsMobile())
    act(() => {
      trigger()
    })
    await waitFor(() => expect(result.current).toBe(false))

    act(() => {
      window.innerWidth = 600
      trigger()
    })
    await waitFor(() => expect(result.current).toBe(true))
  })
})
