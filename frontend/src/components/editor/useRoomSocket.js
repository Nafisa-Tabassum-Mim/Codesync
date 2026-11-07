import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness'
import * as Y from 'yjs'

const RETRY_MS = 2000
const DENIED_CODES = [4401, 4403, 4404, 4409]
const REMOTE = 'remote' // origin tag: "this change came from the server"

const toBase64 = (bytes) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
const fromBase64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0))

// names and colors come from other users' browsers, so never trust them in CSS
const SAFE_COLOR = /^#[0-9a-f]{6}$/i
const cssString = (s) =>
  String(s).slice(0, 40).replace(/[\\"]/g, '\\$&').replace(/[\r\n\f]/g, ' ')

// the rules that color one remote user's selection and cursor label
export function cursorCss(clientId, user) {
  const color = SAFE_COLOR.test(user.color) ? user.color : '#f97316'
  const name = cssString(user.name || 'Guest')
  return `
.yRemoteSelection-${clientId} { background-color: ${color}40; }
.yRemoteSelectionHead-${clientId} { position: absolute; border-left: 2px solid ${color}; height: 100%; box-sizing: border-box; }
.yRemoteSelectionHead-${clientId}::after { content: "${name}"; position: absolute; top: -1.5em; left: -2px; padding: 1px 6px; border-radius: 4px 4px 4px 0; background: ${color}; color: #0b0d17; font-size: 11px; font-weight: 600; line-height: 1.4; white-space: nowrap; pointer-events: none; z-index: 20; }
`
}

export function useRoomSocket(slug, { onOutput, seed } = {}) {
  const ydoc = useMemo(() => new Y.Doc(), [slug]) // eslint-disable-line react-hooks/exhaustive-deps
  const socketRef = useRef(null)
  const awarenessRef = useRef(null) // read by the editor when it mounts
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

    // ---- live cursors: Yjs awareness, relayed through the same socket
    const awareness = new Awareness(ydoc)
    awarenessRef.current = awareness

    const sendAwareness = (clients) => {
      const ws = socketRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || clients.length === 0) return
      const update = toBase64(encodeAwarenessUpdate(awareness, clients))
      ws.send(JSON.stringify({ type: 'awareness', update }))
    }
    const onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === REMOTE) return // do not echo what we just received
      sendAwareness([...added, ...updated, ...removed])
    }
    awareness.on('update', onAwarenessUpdate)

    // one <style> tag holds the color + name label of every remote cursor
    const styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    const refreshStyles = () => {
      let css = ''
      awareness.getStates().forEach((state, id) => {
        if (id !== ydoc.clientID && state.user) css += cursorCss(id, state.user)
      })
      styleEl.textContent = css
    }
    awareness.on('change', refreshStyles)

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

        if (msg.type === 'init') {
          // the server tells us our own name and color for our cursor label
          if (msg.you) {
            awareness.setLocalState({ ...(awareness.getLocalState() ?? {}), user: msg.you })
          }
        } else if (msg.type === 'synced') {
          setStatus('live')
          // brand-new room: ask the server to seed the starter code (it ignores duplicates)
          const s = seedRef.current
          if (s && !ydoc.getMap('meta').get('language')) {
            ws.send(JSON.stringify({ type: 'seed', language: s.language, snippet: s.snippet }))
          }
          sendAwareness([ydoc.clientID])
        } else if (msg.type === 'presence') {
          setPresence({ count: msg.count, users: msg.users })
          // someone joined or left: send our cursor again so newcomers see it at once
          sendAwareness([ydoc.clientID])
        } else if (msg.type === 'awareness') {
          try {
            applyAwarenessUpdate(awareness, fromBase64(msg.update), REMOTE)
          } catch {
            // ignore a malformed update
          }
        } else if (msg.type === 'left') {
          const gone = []
          awareness.getStates().forEach((state, id) => {
            if (id !== ydoc.clientID && state.user?.conn === msg.conn) gone.push(id)
          })
          if (gone.length) removeAwarenessStates(awareness, gone, REMOTE)
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
      awareness.destroy() // announces that our cursor is gone, while the socket is still open
      awareness.off('change', refreshStyles)
      styleEl.remove()
      if (awarenessRef.current === awareness) awarenessRef.current = null
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

  return { ydoc, awarenessRef, status, presence, sendOutput, sendLanguage }
}