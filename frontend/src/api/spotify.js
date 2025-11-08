import apiClient from './client'

export const spotifyAPI = {
  // Auth
  login: async () => {
    const { data } = await apiClient.get('/auth/login')
    return data
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  // Tracks
  getLikedSongs: async (limit = 50, offset = 0) => {
    const { data } = await apiClient.get('/spotify/liked-songs', {
      params: { limit, offset },
    })
    return data
  },

  getRecentlyPlayed: async (limit = 50) => {
    const { data } = await apiClient.get('/spotify/recently-played', {
      params: { limit },
    })
    return data
  },

  // Playlists
  getPlaylists: async (limit = 50, offset = 0) => {
    const { data } = await apiClient.get('/spotify/playlists', {
      params: { limit, offset },
    })
    return data
  },

  getPlaylistTracks: async (playlistId) => {
    const { data } = await apiClient.get(`/spotify/playlist/${playlistId}`)
    return data
  },

  createPlaylist: async (name, description = '', isPublic = false) => {
    const { data } = await apiClient.post('/spotify/playlist/create', null, {
      params: { name, description, public: isPublic },
    })
    return data
  },

  addTracksToPlaylist: async (playlistId, trackUris) => {
    const { data } = await apiClient.post(`/spotify/playlist/${playlistId}/tracks`, {
      track_uris: trackUris,
    })
    return data
  },

  // Queue
  getCurrentQueue: async () => {
    const { data } = await apiClient.get('/spotify/queue')
    return data
  },

  getTrackFeatures: async (trackId) => {
    const { data } = await apiClient.get(`/spotify/track/${trackId}/features`)
    return data
  },
}

export const queueAPI = {
  saveQueue: async (name, tracks, spotifyId) => {
    const { data } = await apiClient.post('/queues/save', {
      name,
      tracks,
      spotify_id: spotifyId,
    })
    return data
  },

  listQueues: async (spotifyId) => {
    const { data } = await apiClient.get(`/queues/list/${spotifyId}`)
    return data
  },

  getQueue: async (queueId) => {
    const { data } = await apiClient.get(`/queues/${queueId}`)
    return data
  },

  updateQueue: async (queueId, name, spotifyId) => {
    const { data } = await apiClient.put(`/queues/${queueId}`, null, {
      params: { name, spotify_id: spotifyId },
    })
    return data
  },

  deleteQueue: async (queueId, spotifyId) => {
    const { data } = await apiClient.delete(`/queues/${queueId}`, {
      params: { spotify_id: spotifyId },
    })
    return data
  },

  // Smart Auto-Sort
  smartSortTrack: async (trackId, spotifyId) => {
    const { data } = await apiClient.post('/queues/smart-sort-track', null, {
      params: { track_id: trackId, spotify_id: spotifyId },
    })
    return data
  },

  enableAutoSort: async (spotifyId) => {
    const { data } = await apiClient.post('/queues/enable-auto-sort', null, {
      params: { spotify_id: spotifyId },
    })
    return data
  },

  disableAutoSort: async (spotifyId) => {
    const { data } = await apiClient.post('/queues/disable-auto-sort', null, {
      params: { spotify_id: spotifyId },
    })
    return data
  },

  getAutoSortStatus: async (spotifyId) => {
    const { data } = await apiClient.get(`/queues/auto-sort-status/${spotifyId}`)
    return data
  },
}

export const aiAPI = {
  generatePlaylistName: async (tracks, mood = null, genre = null) => {
    const { data } = await apiClient.post('/ai/generate-playlist-name', {
      tracks,
      mood,
      genre,
    })
    return data
  },

  suggestGenre: async (trackFeatures) => {
    const { data } = await apiClient.post('/ai/suggest-genre', trackFeatures)
    return data
  },
}

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
