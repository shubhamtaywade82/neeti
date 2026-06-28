import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const apiBase = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : '/api/v1'

export const apiClient = axios.create({
  baseURL: apiBase
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
