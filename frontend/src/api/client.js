import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('spotify-auth') || '{}')
  if (auth.state?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.state.accessToken}`
  }
  return config
})

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const auth = JSON.parse(localStorage.getItem('spotify-auth') || '{}')
        const refreshToken = auth.state?.refreshToken

        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          auth.state.accessToken = data.access_token
          localStorage.setItem('spotify-auth', JSON.stringify(auth))

          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Redirect to login
        localStorage.clear()
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

