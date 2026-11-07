import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'

const RETRY_MS = 2000
const DENIED_CODES = [4401, 4403, 4404, 4409]
const REMOTE = 'remote' // origin tag: "this change came from the server"

export function useRoomSocket(slug, { onOutput, seed } = {}) {
  const ydoc = useMemo(() => new Y.Doc(), [slug]) // eslint-disable-line react-hooks/exhaustive-deps
  const socketRef = useRef(null)
  const onOutputRef = useRef(onOutput)
  const seedRef = useRef(seed)
  const [status, setStatus] = useState('connecting')
  const [presence, setPresence] = useState({ count: 0, users: [] })

  useEffect(() => {
    onOutputRef.current = onOutput
    seedRef.current = seed
  })

  // local edits -> server
  useEffect(() => {
    const onUpdate = (update, origin) => {
      if (origin === REMOTE) return
      const ws = socketRef.current
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(update)
    }
    ydoc.on('update', onUpdate)
    return () => ydoc.off('update', onUpdate)
  }, [ydoc])

  useEffect(() => {
    if (!slug) return
    let closed = false
    let retryTimer = null

    const connect = () => {
      setStatus('connecting')
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${proto}://${location.host}/api/ws/rooms/${slug}`)
      ws.binaryType = 'arraybuffer'
      socketRef.current = ws

      ws.onopen = () => {
        // push everything we have (covers edits made while offline)
        ws.send(Y.encodeStateAsUpdate(ydoc))
      }

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          Y.applyUpdate(ydoc, new Uint8Array(event.data), REMOTE)
          return
        }
        let msg
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }
        if (msg.type === 'synced') {
          setStatus('live')
          // brand-new room: ask the server to seed the starter code (it ignores duplicates)
          const s = seedRef.current
          if (s && !ydoc.getMap('meta').get('language')) {
            ws.send(JSON.stringify({ type: 'seed', language: s.language, snippet: s.snippet }))
          }
        } else if (msg.type === 'presence') {
          setPresence({ count: msg.count, users: msg.users })
        } else if (msg.type === 'output') {
          onOutputRef.current?.(msg)
        }
      }

      ws.onclose = (e) => {
        if (socketRef.current === ws) socketRef.current = null
        if (closed) return
        if (DENIED_CODES.includes(e.code)) {
          setStatus('denied')
          return
        }
        setStatus('connecting')
        retryTimer = setTimeout(connect, RETRY_MS)
      }
    }

    connect()
    return () => {
      closed = true
      clearTimeout(retryTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [slug, ydoc])

  const sendJson = useCallback((obj) => {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj))
  }, [])

  const sendOutput = useCallback(
    (output, isError) => sendJson({ type: 'output', output, isError }),
    [sendJson],
  )
  // the server applies this to the shared doc and sends the result to everyone
  const sendLanguage = useCallback(
    (language, snippet) => sendJson({ type: 'language', language, snippet }),
    [sendJson],
  )

  return { ydoc, status, presence, sendOutput, sendLanguage }
}