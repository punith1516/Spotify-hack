import apiClient from './client'

export const automationAPI = {
  autoSortSongs: async (spotifyId, limit = 50) => {
    const { data } = await apiClient.post('/automation/auto-sort-songs', null, {
      params: { spotify_id: spotifyId, limit },
    })
    return data
  },

  refreshAllPlaylists: async (spotifyId) => {
    const { data } = await apiClient.post('/automation/refresh-playlists', null, {
      params: { spotify_id: spotifyId },
    })
    return data
  },

  refreshPlaylist: async (playlistId, genre, spotifyId) => {
    const { data } = await apiClient.post(
      `/automation/refresh-playlist/${playlistId}`,
      null,
      {
        params: { genre, spotify_id: spotifyId },
      }
    )
    return data
  },

  getGenrePlaylists: async (spotifyId) => {
    const { data } = await apiClient.get(`/automation/genre-playlists/${spotifyId}`)
    return data
  },
}

