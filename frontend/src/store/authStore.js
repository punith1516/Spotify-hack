import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      spotifyId: null,

      setAuth: (accessToken, refreshToken, spotifyId) => {
        set({ accessToken, refreshToken, spotifyId })
      },

      setUser: (user) => {
        set({ user })
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, spotifyId: null })
        localStorage.clear()
      },

      initAuth: () => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const refreshToken = params.get('refresh_token')
        const spotifyId = params.get('spotify_id')

        if (token && refreshToken && spotifyId) {
          get().setAuth(token, refreshToken, spotifyId)
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      },
    }),
    {
      name: 'spotify-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

