import { request } from './apiClient'

export const getMyRooms = () => request('/rooms')
export const getSharedRooms = () => request('/rooms/shared')
export const createRoom = (data) => request('/rooms', { method: 'POST', body: data })
export const deleteRoom = (id) => request(`/rooms/${id}`, { method: 'DELETE' })
export const joinRoom = (slug) =>
  request(`/rooms/${encodeURIComponent(slug)}/join`, { method: 'POST' })

export const inviteUrl = (slug) => `${window.location.origin}/room/${slug}`

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}