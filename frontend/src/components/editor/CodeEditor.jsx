import Editor from '@monaco-editor/react'
import { FileCode2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CODE_SNIPPETS, FILE_NAMES } from './constants.js'
import LanguageSelector from './LanguageSelector.jsx'
import Output from './Output.jsx'
import { applyTextDiff } from './applyTextDiff.js'
import { useRoomSocket } from './useRoomSocket.js'

// custom dark theme: navy background, light-orange and blue syntax colors
const defineThemes = (monaco) => {
  monaco.editor.defineTheme('codesync-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'fdba74' },
      { token: 'string', foreground: '7dd3fc' },
      { token: 'number', foreground: 'fcd34d' },
      { token: 'type', foreground: '93c5fd' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#0a0c16',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#fdba74',
      'editorCursor.foreground': '#fdba74',
      'editor.selectionBackground': '#fb923c33',
    },
  })
}

// applies text that came from another user without sending it back
function applyRemoteText(editor, text, flag) {
  flag.current = true
  try {
    applyTextDiff(editor.getModel(), text)
  } finally {
    flag.current = false
  }
}

const CodeEditor = ({
  initialLanguage = 'javascript',
  roomSlug,
  theme = 'codesync-dark',
  fontSize = 14,
  onLive,
}) => {
  const editorRef = useRef(null)
  const languageRef = useRef(initialLanguage)
  const applyingRemote = useRef(false)
  const pendingText = useRef(null)

  const [language, setLanguage] = useState(initialLanguage)
  const [result, setResult] = useState(null)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })

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
    if (editorRef.current) applyRemoteText(editorRef.current, msg.text, applyingRemote)
    else pendingText.current = msg.text // editor not mounted yet
  }, [])

  const { status, presence, sendUpdate, sendOutput } = useRoomSocket(roomSlug, onRemote)

  // tell the page who is connected (the header shows it)
  useEffect(() => {
    onLive?.({ status, presence })
  }, [status, presence, onLive])

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
      applyRemoteText(editor, pendingText.current, applyingRemote)
      pendingText.current = null
    }
    editor.onDidChangeCursorPosition((e) =>
      setCursor({ line: e.position.lineNumber, col: e.position.column }),
    )
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

  const denied = status === 'denied'
  const options = useMemo(
    () => ({
      fontSize,
      readOnly: denied,
      minimap: { enabled: false },
      padding: { top: 14 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      detectIndentation: false,
    }),
    [fontSize, denied],
  )

  const fileName = FILE_NAMES[language] ?? 'main.txt'

  return (
    <div className="relative z-10 grid min-h-0 flex-1 gap-4 p-4 pt-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
      {/* editor card */}
      <section className="flex h-[65vh] min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0c16] lg:h-auto">
        {/* tab bar */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 border-b-2 border-orange-400 bg-orange-400/10 px-4 py-2.5 text-sm text-white">
            <FileCode2 size={15} className="text-orange-300" />
            {fileName}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            language={language}
            theme={theme}
            beforeMount={defineThemes}
            onMount={onMount}
            defaultValue={CODE_SNIPPETS[initialLanguage] ?? ''}
            onChange={onChange}
            options={options}
          />
        </div>

        {/* status bar */}
        <div className="flex items-center justify-end gap-5 border-t border-white/10 px-4 py-1.5 text-xs text-gray-400">
          <span>
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <LanguageSelector language={language} onSelect={onSelect} />
        </div>
      </section>

      {/* Run Code + Output */}
      <Output
        editorRef={editorRef}
        language={language}
        result={result}
        onResult={handleResult}
      />
    </div>
  )
}

export default CodeEditor