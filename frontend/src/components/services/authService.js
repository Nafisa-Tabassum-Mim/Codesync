import { request } from './apiClient'

export const registerUser = (data) =>
  request('/auth/register', { method: 'POST', body: data })

export const loginUser = (data) =>
  request('/auth/login', { method: 'POST', body: data })

export const logoutUser = () =>
  request('/auth/logout', { method: 'POST' })

export const fetchCurrentUser = () =>
  request('/auth/me')



