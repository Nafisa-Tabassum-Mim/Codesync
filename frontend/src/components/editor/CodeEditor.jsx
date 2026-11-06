import Editor from '@monaco-editor/react'
import { useCallback, useRef, useState } from 'react'
import LanguageSelector from './LanguageSelector'
import { CODE_SNIPPETS } from './constants.js'
import Output from './Output.jsx'
import { applyTextDiff } from './applyTextDiff.js'
import { useRoomSocket } from './useRoomSocket.js'

const STATUS_LABEL = {
  live: 'Live',
  connecting: 'Connecting...',
  denied: 'You do not have access to this room',
}

const CodeEditor = ({ initialLanguage = 'javascript', roomSlug }) => {
  const editorRef = useRef()
  const languageRef = useRef(initialLanguage)
  const applyingRemote = useRef(false)
  const pendingText = useRef(null)
  const [language, setLanguage] = useState(initialLanguage)
  const [result, setResult] = useState(null)

  const applyText = (editor, text) => {
    applyingRemote.current = true // stops the change from being sent back
    try {
      applyTextDiff(editor.getModel(), text)
    } finally {
      applyingRemote.current = false
    }
  }

  const onRemote = useCallback((msg) => {
    if (msg.type === 'output') {
      setResult({ text: msg.output, isError: msg.isError, by: msg.user })
      return
    }
    if (msg.language && msg.language !== languageRef.current) {
      languageRef.current = msg.language
      setLanguage(msg.language)
    }
    if (typeof msg.text !== 'string') return
    if (editorRef.current) applyText(editorRef.current, msg.text)
    else pendingText.current = msg.text // editor not mounted yet
  }, [])

  const { status, presence, sendUpdate, sendOutput } = useRoomSocket(roomSlug, onRemote)

  const handleResult = (r) => {
    setResult({ ...r, by: null })
    sendOutput(r.text, r.isError)
  }
  const onMount = (editor, monaco) => {
    editorRef.current = editor
    applyingRemote.current = true
    editor.getModel().setEOL(monaco.editor.EndOfLineSequence.LF) // same line endings for everyone
    applyingRemote.current = false
    if (pendingText.current !== null) {
      applyText(editor, pendingText.current)
      pendingText.current = null
    }
    editor.focus()
  }

  const onChange = (value) => {
    if (applyingRemote.current) return
    sendUpdate(value ?? '', languageRef.current)
  }

  const onSelect = (lang) => {
    languageRef.current = lang
    setLanguage(lang)
    editorRef.current?.setValue(CODE_SNIPPETS[lang] ?? '') // triggers onChange -> shared
  }

  return (
    <div className="h-[90vh]">
      {roomSlug && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-[#cccccc]">
          <span className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${status === 'live' ? 'bg-green-400' : status === 'denied' ? 'bg-red-500' : 'bg-yellow-400'
                }`}
            />
            {STATUS_LABEL[status]}
          </span>
          {status === 'live' && (
            <span className="text-gray-400">
              {presence.count} connected: {presence.users.join(', ')}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-4">
        <div className="w-1/2">
          <LanguageSelector language={language} onSelect={onSelect} />
          <Editor
            height="75vh"
            language={language}
            theme="vs-dark"
            onMount={onMount}
            defaultValue={CODE_SNIPPETS[initialLanguage] ?? ''}
            onChange={onChange}
            options={{ readOnly: Boolean(roomSlug) && status === 'denied' }}
          />
        </div>
        <Output editorRef={editorRef} language={language} result={result} onResult={handleResult} />
      </div>
    </div>
  )
}

export default CodeEditor