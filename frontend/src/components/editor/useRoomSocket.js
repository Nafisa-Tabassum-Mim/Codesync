import { useCallback, useEffect, useRef, useState } from 'react'

const RETRY_MS = 2000
const DENIED_CODES = [4401, 4403, 4404, 4409]

export function useRoomSocket(slug, onMessage) {
  const socketRef = useRef(null)
  const handlerRef = useRef(onMessage)
  const [status, setStatus] = useState(slug ? 'connecting' : 'offline')
  const [presence, setPresence] = useState({ count: 0, users: [] })

  useEffect(() => {
    handlerRef.current = onMessage
  })

  useEffect(() => {
    if (!slug) return
    let closed = false
    let retry

    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(
        `${proto}://${window.location.host}/api/ws/rooms/${encodeURIComponent(slug)}`,
      )
      socketRef.current = ws
      ws.onopen = () => setStatus('live')
      ws.onmessage = (e) => {
        let msg
        try {
          msg = JSON.parse(e.data)
        } catch {
          return
        }
        if (['init', 'update', 'output'].includes(msg.type)) handlerRef.current?.(msg)
        else if (msg.type === 'presence') setPresence({ count: msg.count, users: msg.users })
      }
      ws.onclose = (e) => {
        if (socketRef.current === ws) socketRef.current = null
        if (closed) return
        if (DENIED_CODES.includes(e.code)) {
          setStatus('denied')
          return
        }
        setStatus('connecting')
        retry = setTimeout(connect, RETRY_MS)
      }
    }

    connect()
    return () => {
      closed = true
      clearTimeout(retry)
      socketRef.current?.close()
    }
  }, [slug])

  const sendUpdate = useCallback((text, language) => {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', text, language }))
    }
  }, [])

  const sendOutput = useCallback((output, isError) => {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', output, isError }))
    }
  }, [])

  return { status, presence, sendUpdate, sendOutput }
}