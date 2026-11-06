export async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(', ')
      : detail || 'Something went wrong'
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return data
}